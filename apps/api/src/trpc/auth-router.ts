import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { db } from "../db/connection";
import { users, organizations, memberships, inviteTokens, projects, tasks } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { EmailService } from "../services/email-service";

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

const protectedProcedure = t.procedure.use(isAuthed);

function signToken(userId: string, orgId: string | null) {
  return jwt.sign({ userId, orgId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export const authRouter = t.router({
  register: t.procedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(2).max(100),
      password: z.string().min(8),
      inviteToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });

      const passwordHash = await bcrypt.hash(input.password, 12);
      const inserted = await db.insert(users).values({
        email: input.email,
        name: input.name,
        passwordHash,
      }).returning({ id: users.id, email: users.email, name: users.name });
      const user = inserted[0];
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // If they came via an invite token, auto-join the org
      if (input.inviteToken) {
        const [invite] = await db.select().from(inviteTokens)
          .where(and(eq(inviteTokens.token, input.inviteToken), eq(inviteTokens.email, input.email)))
          .limit(1);

        if (invite && !invite.usedAt && invite.expiresAt > new Date()) {
          await db.insert(memberships).values({
            userId: user.id,
            orgId: invite.orgId,
            role: invite.role,
            invitedBy: invite.invitedBy,
          });
          await db.update(inviteTokens).set({ usedAt: new Date() }).where(eq(inviteTokens.id, invite.id));
          return { token: signToken(user.id, invite.orgId), user, orgId: invite.orgId };
        }
      }

      return { token: signToken(user.id, null), user, orgId: null };
    }),

  login: t.procedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });

      const [membership] = await db.select({ orgId: memberships.orgId })
        .from(memberships).where(eq(memberships.userId, user.id)).limit(1);

      return {
        token: signToken(user.id, membership?.orgId ?? null),
        user: { id: user.id, email: user.email, name: user.name },
        orgId: membership?.orgId ?? null,
      };
    }),

  createOrg: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      const orgRows = await db.insert(organizations).values({ name: input.name, slug: input.slug }).returning();
      const org = orgRows[0];
      if (!org) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(memberships).values({ userId: ctx.userId, orgId: org.id, role: "owner" });
      return { token: signToken(ctx.userId, org.id), org };
    }),

  updateOrg: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100).optional(),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });
      const [membership] = await db.select({ role: memberships.role })
        .from(memberships)
        .where(and(eq(memberships.userId, ctx.userId), eq(memberships.orgId, ctx.orgId)))
        .limit(1);
      if (!membership || membership.role !== "owner")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners can update org settings" });

      const updatedRows = await db.update(organizations)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(organizations.id, ctx.orgId))
        .returning();
      const updated = updatedRows[0];
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  switchOrg: protectedProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [membership] = await db.select({ id: memberships.id })
        .from(memberships)
        .where(and(eq(memberships.userId, ctx.userId), eq(memberships.orgId, input.orgId)))
        .limit(1);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
      return { token: signToken(ctx.userId, input.orgId) };
    }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });
    return await db
      .select({ id: users.id, name: users.name, email: users.email, role: memberships.role })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.orgId, ctx.orgId));
  }),

  // Invite existing user by email
  inviteUser: protectedProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["admin", "member"]).default("member") }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });

      const [callerMembership] = await db.select({ role: memberships.role })
        .from(memberships)
        .where(and(eq(memberships.userId, ctx.userId), eq(memberships.orgId, ctx.orgId)))
        .limit(1);
      if (!callerMembership || callerMembership.role === "member")
        throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and admins can invite" });

      // Check if already a member
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
      const existingUserId = existingUser[0]?.id;
      if (existingUserId) {
        const alreadyMember = await db.select({ id: memberships.id })
          .from(memberships)
          .where(and(eq(memberships.userId, existingUserId), eq(memberships.orgId, ctx.orgId)))
          .limit(1);
        if (alreadyMember.length) throw new TRPCError({ code: "CONFLICT", message: "User is already a member" });

        await db.insert(memberships).values({ userId: existingUserId, orgId: ctx.orgId, role: input.role, invitedBy: ctx.userId });
        return { type: "added" as const, inviteUrl: null };
      }

      // New user — create invite token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.insert(inviteTokens).values({
        token,
        orgId: ctx.orgId,
        invitedBy: ctx.userId,
        email: input.email,
        role: input.role,
        expiresAt,
      });

      const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
      const inviteUrl = `${baseUrl}/invite/${token}`;

      // Fetch inviter name for the email
      const [inviter] = await db.select({ name: users.name })
        .from(users).where(eq(users.id, ctx.userId)).limit(1);

      const [org] = await db.select({ name: organizations.name })
        .from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1);

      await EmailService.sendInvite({
        to: input.email,
        orgName: org?.name ?? "your organization",
        inviterName: inviter?.name ?? "A teammate",
        inviteUrl,
        role: input.role,
      });

      return { type: "invited" as const, inviteUrl };
    }),

  // Validate an invite token (called on the invite page)
  getInvite: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [invite] = await db.select({
        id: inviteTokens.id,
        email: inviteTokens.email,
        role: inviteTokens.role,
        usedAt: inviteTokens.usedAt,
        expiresAt: inviteTokens.expiresAt,
        orgName: organizations.name,
      })
        .from(inviteTokens)
        .innerJoin(organizations, eq(inviteTokens.orgId, organizations.id))
        .where(eq(inviteTokens.token, input.token))
        .limit(1);

      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite already used" });
      if (invite.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });

      return invite;
    }),

  // Dashboard stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });

    const projectCountRows = await db.select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(eq(projects.orgId, ctx.orgId), sql`deleted_at is null`));

    const taskCounts = await db.select({ status: tasks.status, count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(eq(tasks.orgId, ctx.orgId), sql`deleted_at is null`))
      .groupBy(tasks.status);

    const memberCountRows = await db.select({ count: sql<number>`count(*)::int` })
      .from(memberships)
      .where(eq(memberships.orgId, ctx.orgId));

    return {
      projects: projectCountRows[0]?.count ?? 0,
      members: memberCountRows[0]?.count ?? 0,
      tasks: {
        todo: taskCounts.find(t => t.status === "todo")?.count ?? 0,
        in_progress: taskCounts.find(t => t.status === "in_progress")?.count ?? 0,
        blocked: taskCounts.find(t => t.status === "blocked")?.count ?? 0,
        done: taskCounts.find(t => t.status === "done")?.count ?? 0,
      },
    };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users).where(eq(users.id, ctx.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const orgs = await db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      plan: organizations.plan,
      role: memberships.role,
    })
      .from(memberships)
      .innerJoin(organizations, eq(memberships.orgId, organizations.id))
      .where(eq(memberships.userId, ctx.userId));

    return { ...user, orgs };
  }),
});

export type AuthRouter = typeof authRouter;

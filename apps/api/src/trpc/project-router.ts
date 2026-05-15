import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { db } from "../db/connection";
import { projects, users, memberships } from "../db/schema";
import { sql, eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { EmailService } from "../services/email-service";

const t = initTRPC.context<Context>().create();

const isProtected = t.middleware(async ({ ctx, next }) => {
  if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`);
    return await next({ ctx: { ...ctx, orgId: ctx.orgId, db: tx } });
  });
});

const isAdminOrOwner = t.middleware(async ({ ctx, next }) => {
  if (!ctx.orgId || !ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
  const [membership] = await db
    .select({ role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.userId, ctx.userId), eq(memberships.orgId, ctx.orgId)))
    .limit(1);
  if (!membership || membership.role === "member")
    throw new TRPCError({ code: "FORBIDDEN", message: "Only admins and owners can perform this action" });
  return next({ ctx });
});

const protectedProcedure = t.procedure.use(isProtected);
const adminProcedure = t.procedure.use(isProtected).use(isAdminOrOwner);

export const projectRouter = t.router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(projects).where(sql`deleted_at is null`);
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(3).max(50),
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      const [newProject] = await db.insert(projects).values({
        name: input.name,
        slug: input.slug,
        orgId: ctx.orgId,
      }).returning();
      return newProject;
    }),

  archive: adminProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [archived] = await db.update(projects)
        .set({ deletedAt: new Date(), status: "archived", updatedAt: new Date() })
        .where(eq(projects.id, input.projectId))
        .returning();
      return archived;
    }),

  update: adminProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      name: z.string().min(3).max(50).optional(),
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
    }))
    .mutation(async ({ input }) => {
      const { projectId, ...updateData } = input;
      const [updated] = await db.update(projects)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();
      return updated;
    }),

  generateShareLink: adminProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      clientEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const token = randomBytes(8).toString("hex");
      const rows = await db.update(projects)
        .set({ shareToken: token, updatedAt: new Date() })
        .where(eq(projects.id, input.projectId))
        .returning();
      const updated = rows[0];
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

      const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
      const shareUrl = `${baseUrl}/share/${token}`;

      if (input.clientEmail) {
        const [sender] = await db.select({ name: users.name })
          .from(users).where(eq(users.id, ctx.userId!)).limit(1);
        await EmailService.sendShareLink({
          to: input.clientEmail,
          projectName: updated.name,
          shareUrl,
          senderName: sender?.name ?? "Your team",
        });
      }

      return { ...updated, shareUrl };
    }),
});

export type ProjectRouter = typeof projectRouter;

import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { db } from "../db/connection";
import { projects } from "../db/schema";
import { sql, eq } from "drizzle-orm";
import { PlanService } from "../services/plan-service";
import { randomBytes } from "crypto";

const t = initTRPC.context<Context>().create();

const isProtected = t.middleware(async ({ ctx, next }) => {
  if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });
  
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`);
    return await next({ ctx: { ...ctx, orgId: ctx.orgId, db: tx } });
  });
});

const protectedProcedure = t.procedure.use(isProtected);

export const projectRouter = t.router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(projects).where(sql`deleted_at is null`);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(50),
      slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      // ENFORCE THE LIMIT BEFORE DOING ANYTHING!
      await PlanService.enforceProjectLimit(ctx.orgId);

      const [newProject] = await db.insert(projects).values({
        name: input.name,
        slug: input.slug,
        orgId: ctx.orgId,
      }).returning();

      return newProject;
    }),

  // Soft Delete (Archive) Project
  archive: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [archived] = await db.update(projects)
        .set({ deletedAt: new Date(), status: "archived", updatedAt: new Date() })
        .where(eq(projects.id, input.projectId))
        .returning();
      return archived;
    }),

  // Update Project Details
  update: protectedProcedure
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

  // Generate Client Share Link
  generateShareLink: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const token = randomBytes(8).toString("hex");
      const [updated] = await db.update(projects)
        .set({ shareToken: token, updatedAt: new Date() })
        .where(eq(projects.id, input.projectId))
        .returning();
      return updated;
    }),
});

export type ProjectRouter = typeof projectRouter;

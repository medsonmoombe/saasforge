import { z } from "zod";
import { initTRPC } from "@trpc/server";
import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/connection";
import { projects, tasks } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export async function createPublicContext({ req, res }: { req: FastifyRequest, res: FastifyReply }) {
  return { req, res };
}

const t = initTRPC.context<typeof createPublicContext>().create();

export const publicRouter = t.router({
  getSharedProject: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [project] = await db.select().from(projects).where(eq(projects.shareToken, input.token));
      
      if (!project) throw new Error("Project not found or link is invalid");

      await db.execute(sql`BEGIN`);
      await db.execute(sql`SELECT set_config('app.current_org_id', ${project.orgId}, true)`);

      const projectTasks = await db.select().from(tasks).where(
        eq(tasks.projectId, project.id)
      );

      await db.execute(sql`COMMIT`);

      return {
        name: project.name,
        tasks: projectTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
      };
    }),
});

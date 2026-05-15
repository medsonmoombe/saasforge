import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/connection";
import { projects, tasks } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function createPublicContext({ req, res }: { req: FastifyRequest; res: FastifyReply }) {
  return { req, res };
}

const t = initTRPC.context<typeof createPublicContext>().create();

export const publicRouter = t.router({
  getSharedProject: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const [project] = await db.select().from(projects)
        .where(eq(projects.shareToken, input.token))
        .limit(1);

      if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired share link" });
      if (project.deletedAt) throw new TRPCError({ code: "NOT_FOUND", message: "This project has been archived" });

      const projectTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        blockerReason: tasks.blockerReason,
      })
        .from(tasks)
        .where(and(eq(tasks.projectId, project.id), sql`${tasks.deletedAt} is null`));

      return {
        name: project.name,
        slug: project.slug,
        tasks: projectTasks,
      };
    }),
});

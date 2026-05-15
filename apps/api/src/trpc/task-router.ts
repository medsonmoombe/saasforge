import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { db } from "../db/connection";
import { tasks, activities } from "../db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { ActivityService } from "../services/activity-service";
import { NotificationService } from "../services/notification-service";

const t = initTRPC.context<Context>().create();

const isProtected = t.middleware(async ({ ctx, next }) => {
  if (!ctx.orgId) throw new TRPCError({ code: "FORBIDDEN" });
  
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_org_id', ${ctx.orgId}, true)`);
    return await next({ ctx: { ...ctx, orgId: ctx.orgId, db: tx } });
  });
});

const protectedProcedure = t.procedure.use(isProtected);

export const taskRouter = t.router({
  // Get tasks for a specific project
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.select().from(tasks).where(
        and(eq(tasks.projectId, input.projectId), sql`deleted_at is null`)
      );
    }),

  // Create a task
  create: protectedProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      title: z.string().min(3).max(255),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assigneeId: z.string().optional(),
      dueDate: z.date().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rows = await db.insert(tasks).values({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        orgId: ctx.orgId,
        creatorId: ctx.userId!,
      }).returning();
      const newTask = rows[0];
      if (!newTask) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ActivityService.logEvent({
        orgId: ctx.orgId!,
        taskId: newTask.id,
        userId: ctx.userId!,
        action: "task_created",
        payload: { title: newTask.title },
      });

      return newTask;
    }),

  // Update task status (Kanban drag & drop) - NOW WITH BLOCKED SUPPORT
  updateStatus: protectedProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      status: z.enum(["todo", "in_progress", "blocked", "done"]),
      blockerReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: any = { status: input.status, updatedAt: new Date() };

      if (input.status === "blocked") {
        if (!input.blockerReason) throw new TRPCError({ code: "BAD_REQUEST", message: "Blocker reason is required." });
        updateData.blockerReason = input.blockerReason;
      } else {
        updateData.blockerReason = null;
      }

      const statusRows = await db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, input.taskId))
        .returning();
      const updatedTask = statusRows[0];
      if (!updatedTask) throw new TRPCError({ code: "NOT_FOUND" });

      await ActivityService.logEvent({
        orgId: ctx.orgId!,
        taskId: input.taskId,
        userId: ctx.userId!,
        action: "status_changed",
        payload: { to: input.status, blockerReason: input.blockerReason },
      });

      // Send notification if task is blocked and has an assignee
      if (input.status === "blocked" && updatedTask.assigneeId) {
        await NotificationService.create({
          orgId: ctx.orgId!,
          recipientId: updatedTask.assigneeId,
          actorId: ctx.userId!,
          type: "status_changed",
          message: `Task "${updatedTask.title}" was blocked.`,
          entityId: updatedTask.id,
        });
      }

      return updatedTask;
    }),

  // Soft Delete Task
  archive: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const archiveRows = await db.update(tasks)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId))
        .returning();
      const archived = archiveRows[0];
      if (!archived) throw new TRPCError({ code: "NOT_FOUND" });

      await ActivityService.logEvent({
        orgId: ctx.orgId!,
        taskId: input.taskId,
        userId: ctx.userId!,
        action: "task_archived",
      });

      return archived;
    }),

  // Update Task Details (Title, Description, Priority, Assignee, Due Date)
  update: protectedProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      title: z.string().min(3).max(255).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      assigneeId: z.string().optional().nullable(),
      dueDate: z.date().optional().nullable(),
      blockerReason: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { taskId, ...updateData } = input;

      // Fetch current state to diff against — prevents duplicate activity records
      const [current] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

      const [updated] = await db.update(tasks)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(tasks.id, taskId))
        .returning();

      // Only log when the value actually changed
      if (input.status !== undefined && input.status !== current?.status)
        await ActivityService.logEvent({ orgId: ctx.orgId!, taskId, userId: ctx.userId!, action: "status_changed", payload: { from: current?.status, to: input.status, blockerReason: input.blockerReason } });

      if (input.priority !== undefined && input.priority !== current?.priority)
        await ActivityService.logEvent({ orgId: ctx.orgId!, taskId, userId: ctx.userId!, action: "priority_changed", payload: { from: current?.priority, to: input.priority } });

      if (input.assigneeId !== undefined && input.assigneeId !== current?.assigneeId)
        await ActivityService.logEvent({ orgId: ctx.orgId!, taskId, userId: ctx.userId!, action: "assignee_changed", payload: { from: current?.assigneeId, to: input.assigneeId } });

      if (input.dueDate !== undefined && String(input.dueDate) !== String(current?.dueDate))
        await ActivityService.logEvent({ orgId: ctx.orgId!, taskId, userId: ctx.userId!, action: "due_date_changed", payload: { from: current?.dueDate, to: input.dueDate } });

      // Notify assignee only when assignee actually changed to a new person
      if (input.assigneeId && input.assigneeId !== current?.assigneeId) {
        await NotificationService.create({
          orgId: ctx.orgId!,
          recipientId: input.assigneeId,
          actorId: ctx.userId!,
          type: "task_assigned",
          message: `You were assigned to "${updated?.title}".`,
          entityId: updated?.id,
        });
      }

      return updated;
    }),

  // Get Activity Timeline for a task
  getActivities: protectedProcedure
    .input(z.object({ taskId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { users } = await import("../db/schema");
      return await db
        .select({
          id: activities.id,
          taskId: activities.taskId,
          action: activities.action,
          payload: activities.payload,
          createdAt: activities.createdAt,
          userId: activities.userId,
          userName: users.name,
        })
        .from(activities)
        .innerJoin(users, eq(users.id, activities.userId))
        .where(eq(activities.taskId, input.taskId))
        .orderBy(desc(activities.createdAt));
    }),
});

export type TaskRouter = typeof taskRouter;

import { z } from "zod";
import { initTRPC } from "@trpc/server";
import { Context } from "./context";
import { db } from "../db/connection";
import { notifications } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.orgId) throw new Error("Not authenticated");
  return next({ ctx: { ...ctx, userId: ctx.userId, orgId: ctx.orgId } });
});

const protectedProcedure = t.procedure.use(isAuthed);

export const notificationRouter = t.router({
  getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.recipientId, ctx.userId),
        eq(notifications.orgId, ctx.orgId)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.recipientId, ctx.userId)
        ));
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.recipientId, ctx.userId),
        eq(notifications.orgId, ctx.orgId),
        eq(notifications.read, false)
      ));
  }),
});

export type NotificationRouter = typeof notificationRouter;

import { db } from "../db/connection";
import { notifications } from "../db/schema";

export const NotificationService = {
  async create({
    orgId,
    recipientId,
    actorId,
    type,
    message,
    entityId,
  }: {
    orgId: string;
    recipientId: string;
    actorId?: string;
    type: "task_assigned" | "status_changed" | "overdue_warning" | "project_shared";
    message: string;
    entityId?: string;
  }) {
    // Don't notify yourself!
    if (recipientId === actorId) return;

    try {
      await db.insert(notifications).values({
        orgId,
        recipientId,
        actorId,
        type,
        message,
        entityId,
      });
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  },
};

import { db } from "../db/connection";
import { activities } from "../db/schema";

export class ActivityService {
  static async logEvent(params: {
    orgId: string;
    taskId: string;
    userId: string;
    action: string;
    payload?: Record<string, any>;
  }) {
    await db.insert(activities).values({
      orgId: params.orgId,
      taskId: params.taskId,
      userId: params.userId,
      action: params.action,
      payload: params.payload || {},
    });
  }
}

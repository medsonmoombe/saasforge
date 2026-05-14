export type Task = {
  id: string;
  orgId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "blocked" | "done";
  blockerReason: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  creatorId: string;
  dueDate: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { trpc } from "../trpc/client";
import type { Task } from "../types";
import {
  Loader2,
  Archive,
  Circle,
  CheckCircle2,
  Timer,
  ShieldAlert,
  CalendarDays,
  AlignLeft,
  Flag,
  UserRound,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<string, { icon: ReactNode; label: string; badge: string; dot: string; card: string }> = {
  todo: {
    icon: <Circle className="h-4 w-4 text-slate-400" />,
    label: "To Do",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
    card: "border-slate-200/80 bg-slate-50/90 dark:border-slate-700/70 dark:bg-slate-900/70",
  },
  in_progress: {
    icon: <Timer className="h-4 w-4 text-blue-500" />,
    label: "In Progress",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    dot: "bg-blue-500",
    card: "border-blue-200/80 bg-blue-50/90 dark:border-blue-900/60 dark:bg-blue-950/25",
  },
  blocked: {
    icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
    label: "Blocked",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    dot: "bg-red-500",
    card: "border-red-200/80 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/25",
  },
  done: {
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    label: "Done",
    badge: "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    dot: "bg-green-500",
    card: "border-green-200/80 bg-green-50/90 dark:border-green-900/60 dark:bg-green-950/25",
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    dot: "bg-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    card: "border-slate-200/80 bg-slate-50/90 dark:border-slate-700/70 dark:bg-slate-900/70",
  },
  medium: {
    label: "Medium",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    card: "border-blue-200/80 bg-blue-50/90 dark:border-blue-900/60 dark:bg-blue-950/25",
  },
  high: {
    label: "High",
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    card: "border-orange-200/80 bg-orange-50/90 dark:border-orange-900/60 dark:bg-orange-950/25",
  },
  urgent: {
    label: "Urgent",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    card: "border-red-200/80 bg-red-50/90 dark:border-red-900/60 dark:bg-red-950/25",
  },
} as const;

type TaskFormState = {
  title: string;
  description: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  dueDate: string;
  blockerReason: string;
};

const priorityOptions = Object.entries(priorityConfig).map(([value, config]) => ({
  value: value as TaskFormState["priority"],
  label: config.label,
})) as ReadonlyArray<{ value: TaskFormState["priority"]; label: string }>;

type OrgMember = {
  id: string;
  name: string;
};

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
  projectId: string;
  orgMembers: OrgMember[];
}

function normalizeStatus(value: string | null | undefined): TaskFormState["status"] {
  if (value === "todo" || value === "in_progress" || value === "blocked" || value === "done") {
    return value;
  }
  return "todo";
}

function normalizePriority(value: string | null | undefined): TaskFormState["priority"] {
  if (value === "low" || value === "medium" || value === "high" || value === "urgent") {
    return value;
  }
  return "medium";
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildInitialState(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? "",
    status: normalizeStatus(task.status),
    priority: normalizePriority(task.priority),
    assigneeId: task.assigneeId ?? null,
    dueDate: toDateInputValue(task.dueDate),
    blockerReason: task.blockerReason ?? "",
  };
}

function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} />;
}

export function TaskDrawer({ task, onClose, projectId, orgMembers }: TaskDrawerProps) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<TaskFormState | null>(null);

  useEffect(() => {
    if (!task) {
      setForm(null);
      return;
    }

    setForm(buildInitialState(task));
  }, [task]);

  const { data: taskActivities } = trpc.tasks.getActivities.useQuery(
    { taskId: task?.id ?? "" },
    { enabled: !!task?.id }
  );

  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.getByProject.invalidate({ projectId });
      onClose();
    },
  });

  const archiveTask = trpc.tasks.archive.useMutation({
    onSuccess: () => {
      utils.tasks.getByProject.invalidate({ projectId });
      onClose();
    },
  });

  const assigneeName = useMemo(() => {
    if (!form?.assigneeId) return "Unassigned";
    return orgMembers.find((m) => m.id === form.assigneeId)?.name ?? "Assigned";
  }, [form?.assigneeId, orgMembers]);

  const formatActivityValue = (action: string, value: unknown) => {
    if (!value) return "";
    if (action === "assignee_changed" && typeof value === "string") {
      return orgMembers.find(m => m.id === value)?.name ?? value.slice(0, 8);
    }
    if (typeof value === "string") return value.replace(/_/g, " ");
    return JSON.stringify(value);
  };

  if (!task || !form) return null;

  const currentStatus = statusConfig[form.status] ?? statusConfig.todo;
  const currentPriority = priorityConfig[form.priority] ?? priorityConfig.medium;

  return (
    <Sheet open={!!task} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="flex w-full flex-col border-l border-slate-200/70 bg-white/96 p-0 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/96 sm:max-w-[560px]">
        <SheetHeader className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800/70">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.badge}`}>
                  <Dot className={currentStatus.dot} />
                  {currentStatus.icon}
                  {currentStatus.label}
                </div>
                <SheetTitle className="text-left text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Refine task details
                </SheetTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Keep the task clear, assigned, and ready for execution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-2xl border px-3 py-3 ${currentPriority.card}`}>
                <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <Flag className="h-3.5 w-3.5" />
                  Priority
                </div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Dot className={currentPriority.dot} />
                  {currentPriority.label}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-3 dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <UserRound className="h-3.5 w-3.5" />
                  Owner
                </div>
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{assigneeName}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 ${currentStatus.card}`}>
                <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <Timer className="h-3.5 w-3.5" />
                  Status
                </div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  <Dot className={currentStatus.dot} />
                  {currentStatus.label}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-slate-800/70 dark:bg-slate-900/60">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Due Date
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{form.dueDate || "Not set"}</p>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateTask.mutate({
              taskId: task.id,
              title: form.title,
              description: form.description || null,
              status: form.status,
              priority: form.priority,
              assigneeId: form.assigneeId,
              dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`) : null,
              blockerReason: form.status === "blocked" ? form.blockerReason || null : null,
            });
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <section className="space-y-4 rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <AlignLeft className="h-4 w-4 text-blue-500" />
                Core details
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Title
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((current) => current ? { ...current, title: e.target.value } : current)}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Description
                </label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((current) => current ? { ...current, description: e.target.value } : current)}
                  rows={5}
                  className="resize-none rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70"
                  placeholder="Add context, acceptance notes, or handoff details..."
                />
              </div>
            </section>

            <section className={`space-y-4 rounded-[28px] border bg-white/90 p-5 shadow-sm dark:bg-slate-900/80 ${currentStatus.card}`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Flag className="h-4 w-4 text-indigo-500" />
                Workflow
              </div>

              <div className="flex flex-wrap gap-2">
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.badge}`}>
                  <Dot className={currentStatus.dot} />
                  {currentStatus.label}
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${currentPriority.badge}`}>
                  <Dot className={currentPriority.dot} />
                  {currentPriority.label} priority
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Status
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              status: value as TaskFormState["status"],
                              blockerReason: value === "blocked" ? current.blockerReason : "",
                            }
                          : current
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Priority
                  </label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) =>
                      setForm((current) => current ? { ...current, priority: value as TaskFormState["priority"] } : current)
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Assignee
                  </label>
                  <Select
                    value={form.assigneeId || "unassigned"}
                    onValueChange={(value) =>
                      setForm((current) => current ? { ...current, assigneeId: value === "unassigned" ? null : value } : current)
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {orgMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Due date
                  </label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((current) => current ? { ...current, dueDate: e.target.value } : current)}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70"
                  />
                </div>
              </div>

              {form.status === "blocked" && (
                <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50/70 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-red-600 dark:text-red-300">
                    Blocker reason
                  </label>
                  <Input
                    value={form.blockerReason}
                    onChange={(e) => setForm((current) => current ? { ...current, blockerReason: e.target.value } : current)}
                    placeholder="What is stopping progress right now?"
                    className="h-11 rounded-xl border-red-200 bg-white/80 dark:border-red-900/60 dark:bg-slate-900/70"
                  />
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Activity className="h-4 w-4 text-emerald-500" />
                Activity timeline
              </div>

              <div className="space-y-3">
                {taskActivities && taskActivities.length > 0 ? (
                  taskActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800/70 dark:bg-slate-800/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {activity.action.replace(/_/g, " ")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {activity.userName ?? activity.userId}
                            {activity.payload?.to ? ` → ${formatActivityValue(activity.action, activity.payload.to)}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                          {new Date(activity.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                    No activity yet for this task.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-slate-200/70 bg-white/92 px-6 py-4 dark:border-slate-800/70 dark:bg-slate-950/92">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:hover:bg-red-950/40"
                size="sm"
                onClick={() => archiveTask.mutate({ taskId: task.id })}
              >
                {archiveTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                Archive
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={onClose} size="sm" className="h-10 rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateTask.isPending}
                  size="sm"
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 hover:from-blue-700 hover:to-indigo-700"
                >
                  {updateTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

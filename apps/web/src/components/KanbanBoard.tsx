"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { trpc } from "../trpc/client";
import type { Task } from "../types";
import {
  DragDropContext, Droppable, Draggable,
  type DraggableProvidedDragHandleProps,
  type DraggableProvidedDraggableProps,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Loader2, Plus, Circle, CheckCircle2, Timer, AlertCircle, User,
  ArrowUp, ArrowRight, ArrowDown, ShieldAlert, Search, X, Share2,
  Copy, Check, Mail, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TaskDrawer } from "./TaskDrawer";
import { toast } from "sonner";

const groupByStatus = (tasks: Task[]) => ({
  todo: tasks.filter(t => t.status === "todo"),
  in_progress: tasks.filter(t => t.status === "in_progress"),
  blocked: tasks.filter(t => t.status === "blocked"),
  done: tasks.filter(t => t.status === "done"),
});

const priorityConfig: Record<string, { label: string; color: string; bg: string; icon: ReactNode }> = {
  urgent: { label: "Urgent", color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
  high: { label: "High", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800", icon: <ArrowUp className="h-3 w-3 mr-1" /> },
  medium: { label: "Medium", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800", icon: <ArrowRight className="h-3 w-3 mr-1" /> },
  low: { label: "Low", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700", icon: <ArrowDown className="h-3 w-3 mr-1" /> },
};

const statusConfig: Record<string, { icon: ReactNode; color: string }> = {
  todo: { icon: <Circle className="h-4 w-4 text-slate-400" />, color: "text-slate-500" },
  in_progress: { icon: <Timer className="h-4 w-4 text-blue-500" />, color: "text-blue-600 dark:text-blue-400" },
  blocked: { icon: <ShieldAlert className="h-4 w-4 text-red-500" />, color: "text-red-600 dark:text-red-400" },
  done: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "text-green-600 dark:text-green-400" },
};

interface KanbanBoardProps { projectId: string; }

interface TaskCardProps {
  task: Task; isDragging: boolean; orgMembers: { id: string; name: string }[];
  onClick: () => void; draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
  innerRef: (element?: HTMLElement | null) => void; style?: CSSProperties;
}

function TaskCard({ task, isDragging, orgMembers, onClick, draggableProps, dragHandleProps, innerRef, style }: TaskCardProps) {
  const card = (
    <Card
      ref={innerRef} {...draggableProps} {...dragHandleProps}
      onClick={() => !isDragging && onClick()}
      className={`cursor-pointer transition-colors border relative ${isDragging
        ? "shadow-2xl ring-2 ring-blue-500/30 bg-white dark:bg-slate-800 rotate-[1deg]"
        : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg"
      }`}
      style={{ ...style, zIndex: isDragging ? 99999 : style?.zIndex, boxShadow: isDragging ? "0 24px 60px rgba(15,23,42,0.22)" : style?.boxShadow }}
    >
      <CardContent className="p-3.5">
        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2.5">{task.title}</h4>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
            {priorityConfig[task.priority].icon}{priorityConfig[task.priority].label}
          </span>
          {task.assigneeId ? (
            <Avatar className="h-6 w-6 border-2 border-white dark:border-slate-800 shadow-sm">
              <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                {orgMembers?.find(m => m.id === task.assigneeId)?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <User className="h-3 w-3 text-slate-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
  if (isDragging && typeof document !== "undefined") return createPortal(card, document.body);
  return card;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  // Share dialog state
  const [shareOpen, setShareOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: me } = trpc.auth.me.useQuery();
  const orgMembers = me ? [{ id: me.id, name: me.name }] : [];

  const utils = trpc.useUtils();

  const { data: rawTasks, isLoading: loadingTasks } = trpc.tasks.getByProject.useQuery(
    { projectId }, { enabled: !!projectId }
  );

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => { utils.tasks.getByProject.invalidate({ projectId }); setTaskTitle(""); toast.success("Task created"); },
    onError: () => toast.error("Failed to create task"),
  });

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onMutate: async (vars) => {
      await utils.tasks.getByProject.cancel({ projectId });
      const prev = utils.tasks.getByProject.getData({ projectId });
      utils.tasks.getByProject.setData({ projectId }, (old: Task[] | undefined) =>
        old?.map(t => t.id === vars.taskId ? { ...t, status: vars.status, blockerReason: vars.blockerReason ?? null } : t)
      );
      return { prev };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.prev) utils.tasks.getByProject.setData({ projectId }, ctx.prev);
      toast.error("Failed to update status");
    },
    onSettled: () => utils.tasks.getByProject.invalidate({ projectId }),
  });

  const generateShareLink = trpc.projects.generateShareLink.useMutation({
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      toast.success(clientEmail ? `Board link sent to ${clientEmail}!` : "Share link generated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as "todo" | "in_progress" | "blocked" | "done";
    if (newStatus === "blocked") {
      const reason = prompt("Why is this task blocked?");
      if (!reason) return;
      updateStatus.mutate({ taskId: result.draggableId, status: newStatus, blockerReason: reason });
    } else {
      updateStatus.mutate({ taskId: result.draggableId, status: newStatus });
    }
  };

  const handleShare = () => {
    setEmailError("");
    if (!clientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setShareUrl(null);
    generateShareLink.mutate({ projectId, clientEmail });
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTasks = rawTasks?.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (filterPriority === "all" || t.priority === filterPriority)
  );
  const groupedTasks = filteredTasks ? groupByStatus(filteredTasks) : undefined;

  const columns = [
    { id: "todo" as const, title: "To Do" },
    { id: "in_progress" as const, title: "In Progress" },
    { id: "blocked" as const, title: "Blocked" },
    { id: "done" as const, title: "Done" },
  ];

  return (
    <>
      <section className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Toolbar */}
        <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-3 sm:px-6 py-3 shrink-0 relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-xl font-semibold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
              Task Board
            </h2>

            {/* Share dialog */}
            <Dialog open={shareOpen} onOpenChange={(v) => { setShareOpen(v); if (!v) { setClientEmail(""); setShareUrl(null); setEmailError(""); setCopied(false); } }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share to Client</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Share Board with Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's email. They'll receive a read-only link — no account needed.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Client Email
                    </label>
                    <Input
                      type="email"
                      placeholder="client@company.com"
                      value={clientEmail}
                      onChange={(e) => { setClientEmail(e.target.value); setEmailError(""); setShareUrl(null); }}
                      disabled={generateShareLink.isPending}
                      className="h-10"
                    />
                    {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                  </div>

                  <Button
                    onClick={handleShare}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={generateShareLink.isPending}
                  >
                    {generateShareLink.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send Board Link
                      </span>
                    )}
                  </Button>

                  {/* Result */}
                  {shareUrl && (
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Email sent! Backup link:
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-md px-3 py-2">
                          <Link2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <code className="text-xs text-green-700 dark:text-green-300 truncate">{shareUrl}</code>
                        </div>
                        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0" onClick={copyLink}>
                          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search + filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white/50 dark:bg-slate-800/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[130px] h-9 bg-white/50 dark:bg-slate-800/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick add */}
          <form onSubmit={(e) => { e.preventDefault(); createTask.mutate({ projectId, title: taskTitle, priority: taskPriority }); }} className="flex gap-2">
            <Input
              placeholder="Quick add task..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="flex-1 min-w-0 h-9 text-sm bg-white/50 dark:bg-slate-800/50"
              required
            />
            <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as any)}>
              <SelectTrigger className="w-[110px] h-9 text-xs bg-white/50 dark:bg-slate-800/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm" disabled={createTask.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1.5 hidden sm:inline">Add</span>
            </Button>
          </form>
        </div>

        {/* Board */}
        {loadingTasks ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading tasks...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 sm:gap-6 p-3 sm:p-6 flex-1 overflow-x-auto overflow-y-hidden relative z-0">
              {columns.map((col) => (
                <Droppable droppableId={col.id} key={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef} {...provided.droppableProps}
                      className={`flex flex-col rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all relative z-0 shrink-0 w-[280px] sm:w-auto sm:flex-1 ${snapshot.isDraggingOver ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-300/60 dark:border-blue-800/60 shadow-lg scale-[1.02]" : "hover:shadow-md"}`}
                    >
                      <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={statusConfig[col.id].color}>{statusConfig[col.id].icon}</span>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.title}</h3>
                        </div>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {groupedTasks?.[col.id]?.length || 0}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                        {groupedTasks?.[col.id]?.map((task, index) => (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(provided, snapshot) => (
                              <TaskCard
                                task={task} isDragging={snapshot.isDragging} orgMembers={orgMembers}
                                onClick={() => setEditingTask(task)}
                                draggableProps={provided.draggableProps} dragHandleProps={provided.dragHandleProps}
                                innerRef={provided.innerRef} style={provided.draggableProps.style}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </section>

      <TaskDrawer task={editingTask} onClose={() => setEditingTask(null)} projectId={projectId} orgMembers={orgMembers} />
    </>
  );
}

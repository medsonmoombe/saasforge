"use client";

import { publicTrpc, PublicTRPCProvider } from "@/trpc/public-client";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, CheckCircle2, Timer, ShieldAlert, AlertCircle, ArrowUp, ArrowRight, ArrowDown, Loader2, XCircle, Sparkles } from "lucide-react";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; title: string; colBg: string }> = {
  todo:        { icon: <Circle className="h-4 w-4" />,       color: "text-slate-400",  title: "To Do",      colBg: "bg-slate-50 dark:bg-slate-900/40" },
  in_progress: { icon: <Timer className="h-4 w-4" />,        color: "text-blue-500",   title: "In Progress", colBg: "bg-blue-50/50 dark:bg-blue-950/20" },
  blocked:     { icon: <ShieldAlert className="h-4 w-4" />,  color: "text-red-500",    title: "Blocked",    colBg: "bg-red-50/50 dark:bg-red-950/20" },
  done:        { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-500",  title: "Done",       colBg: "bg-green-50/50 dark:bg-green-950/20" },
};

const priorityConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  urgent: { icon: <AlertCircle className="h-3 w-3" />, label: "Urgent", color: "text-red-600 bg-red-50 dark:bg-red-950/40" },
  high:   { icon: <ArrowUp className="h-3 w-3" />,     label: "High",   color: "text-orange-600 bg-orange-50 dark:bg-orange-950/40" },
  medium: { icon: <ArrowRight className="h-3 w-3" />,  label: "Medium", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  low:    { icon: <ArrowDown className="h-3 w-3" />,   label: "Low",    color: "text-slate-500 bg-slate-100 dark:bg-slate-800" },
};

const COLUMNS = ["todo", "in_progress", "blocked", "done"] as const;

function PortalContent() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = publicTrpc.public.getSharedProject.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading project board...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Invalid Link</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error?.message ?? "This share link is invalid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  const total = data.tasks.length;
  const done = data.tasks.filter(t => t.status === "done").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SaaSForge · Client View</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{data.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-xs h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">
              {progress}% · {done}/{total} done
            </span>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = data.tasks.filter(t => t.status === col);
            const cfg = statusConfig[col];
            return (
              <div
                key={col}
                className={`flex flex-col rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0 w-[280px] sm:w-72 ${cfg.colBg}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cfg.title}</h3>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-3 space-y-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-6">No tasks</p>
                  ) : colTasks.map(task => {
                    const pCfg = priorityConfig[task.priority];
                    return (
                      <Card key={task.id} className="bg-white/90 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <CardContent className="p-3.5">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{task.title}</p>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${pCfg.color}`}>
                              {pCfg.icon}{pCfg.label}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-slate-400 shrink-0">
                                Due {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {task.blockerReason && (
                            <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">
                              🚫 {task.blockerReason}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <PublicTRPCProvider>
      <PortalContent />
    </PublicTRPCProvider>
  );
}

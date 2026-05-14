"use client";

import { publicTrpc, PublicTRPCProvider } from "@/trpc/public-client";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, CheckCircle2, Timer, ShieldAlert } from "lucide-react";

const statusConfig: Record<string, { icon: React.ReactNode; color: string; title: string }> = {
  todo: { icon: <Circle className="h-4 w-4 text-slate-400" />, color: "text-slate-500", title: "To Do" },
  in_progress: { icon: <Timer className="h-4 w-4 text-blue-500" />, color: "text-blue-600", title: "In Progress" },
  blocked: { icon: <ShieldAlert className="h-4 w-4 text-red-500" />, color: "text-red-600", title: "Blocked" },
  done: { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: "text-green-600", title: "Done" },
};

const priorityLabels: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

function PortalContent() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading } = publicTrpc.public.getSharedProject.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading Project...</div>;
  if (!data) return <div className="flex h-screen items-center justify-center text-red-500">Invalid or expired link.</div>;

  const columns = ["todo", "in_progress", "done"];
  const totalTasks = data.tasks.length;
  const doneTasks = data.tasks.filter(t => t.status === "done").length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-4">{data.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{progress}% Complete ({doneTasks}/{totalTasks})</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col} className="flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className={statusConfig[col].color}>{statusConfig[col].icon}</span>
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">{statusConfig[col].title}</h3>
                <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">{data.tasks.filter(t => t.status === col).length}</span>
              </div>
              <div className="space-y-3">
                {data.tasks.filter(t => t.status === col).map(task => (
                  <Card key={task.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">{task.title}</h4>
                        <span className="text-sm" title={task.priority}>{priorityLabels[task.priority]}</span>
                      </div>
                      {task.dueDate && <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
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

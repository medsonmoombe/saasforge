"use client";

import { trpc } from "@/trpc/client";
import { FolderKanban, Users, CheckCircle2, Timer, Circle, ShieldAlert } from "lucide-react";
import { useAuthContext } from "@/lib/auth-context";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function DashboardView() {
  const { orgId } = useAuthContext();
  const { data: stats, isLoading } = trpc.auth.getDashboardStats.useQuery(undefined, { enabled: !!orgId });
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: !!orgId });

  const currentOrg = me?.orgs.find(o => o.id === orgId) ?? me?.orgs[0];

  if (!orgId) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        No organization selected
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {currentOrg ? `Welcome to ${currentOrg.name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening across your organization
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <StatCard
                label="Projects"
                value={stats.projects}
                icon={<FolderKanban className="h-5 w-5 text-blue-600" />}
                color="bg-blue-50 dark:bg-blue-950/50"
              />
              <StatCard
                label="Team Members"
                value={stats.members}
                icon={<Users className="h-5 w-5 text-indigo-600" />}
                color="bg-indigo-50 dark:bg-indigo-950/50"
              />
              <StatCard
                label="Tasks Done"
                value={stats.tasks.done}
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                color="bg-green-50 dark:bg-green-950/50"
              />
              <StatCard
                label="Blocked"
                value={stats.tasks.blocked}
                icon={<ShieldAlert className="h-5 w-5 text-red-600" />}
                color="bg-red-50 dark:bg-red-950/50"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Task Overview</h2>
              <div className="space-y-3">
                {[
                  { label: "To Do", value: stats.tasks.todo, icon: <Circle className="h-4 w-4 text-slate-400" />, bar: "bg-slate-300 dark:bg-slate-600" },
                  { label: "In Progress", value: stats.tasks.in_progress, icon: <Timer className="h-4 w-4 text-blue-500" />, bar: "bg-blue-500" },
                  { label: "Blocked", value: stats.tasks.blocked, icon: <ShieldAlert className="h-4 w-4 text-red-500" />, bar: "bg-red-500" },
                  { label: "Done", value: stats.tasks.done, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, bar: "bg-green-500" },
                ].map(({ label, value, icon, bar }) => {
                  const total = stats.tasks.todo + stats.tasks.in_progress + stats.tasks.blocked + stats.tasks.done;
                  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      {icon}
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-24 shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-8 text-right">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { trpc } from "../trpc/client";
import { FolderKanban, Archive, LayoutDashboard, Users, Settings, ChevronDown, ChevronRight, Plus, Layers, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuthContext } from "@/lib/auth-context";

interface Props {
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  activeView: string;
  onChangeView: (view: string) => void;
  open: boolean;
  onClose: () => void;
}

const navLinks = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: Layers },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ProjectSidebar({ selectedProjectId, onSelectProject, activeView, onChangeView, open, onClose }: Props) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const { orgId, userId } = useAuthContext();
  const { data: members } = trpc.auth.getMembers.useQuery();
  const canManage = members?.find(m => m.id === userId)?.role !== "member";
  const { data: projects } = trpc.projects.getAll.useQuery();
  const utils = trpc.useUtils();

  const archive = trpc.projects.archive.useMutation({
    onSuccess: () => {
      utils.projects.getAll.invalidate();
      onSelectProject(null);
      onChangeView("projects");
      toast.success("Project archived");
    },
  });

  const navigate = (view: string, projectId?: string) => {
    if (projectId) {
      onSelectProject(projectId);
      onChangeView("board");
    } else {
      onChangeView(view);
      onSelectProject(null);
    }
    onClose(); // close drawer on mobile after navigation
  };

  const sidebarContent = (
    <aside className="flex h-full w-60 flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60">
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 lg:hidden">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Menu</span>
        <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="px-3 pt-3 pb-2 space-y-0.5">
        {navLinks.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigate(id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              activeView === id && !selectedProjectId
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mx-3 my-2 border-t border-slate-200/60 dark:border-slate-700/60" />

      {/* Recent projects */}
      <div className="flex-1 flex flex-col overflow-hidden px-3">
        <div className="flex items-center justify-between py-1.5 mb-1">
          <button
            type="button"
            onClick={() => setProjectsExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {projectsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Recent
          </button>
          {canManage && (
          <button
            type="button"
            onClick={() => navigate("projects")}
            className="flex items-center justify-center h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          )}
        </div>

        {projectsExpanded && (
          <div className="flex-1 overflow-y-auto space-y-0.5 pb-4">
            {!projects?.length ? (
              <button
                type="button"
                onClick={() => navigate("projects")}
                className="w-full text-xs text-slate-400 dark:text-slate-500 px-2 py-3 text-center hover:text-blue-500 transition-colors"
              >
                + Create your first project
              </button>
            ) : (
              projects.slice(0, 8).map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "group flex items-center rounded-lg transition-all",
                    selectedProjectId === project.id
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigate("board", project.id)}
                    className="flex flex-1 min-w-0 items-center gap-2.5 px-3 py-2 text-sm text-left"
                  >
                    <FolderKanban className={cn("h-4 w-4 shrink-0", selectedProjectId === project.id ? "text-blue-500" : "text-slate-400")} />
                    <span className="truncate font-medium">{project.name}</span>
                  </button>
                  {canManage && (
                  <button
                    type="button"
                    onClick={() => { if (confirm("Archive this project?")) archive.mutate({ projectId: project.id }); }}
                    className="shrink-0 pr-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: slide-in drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden flex">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}

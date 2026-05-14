"use client";

import { useState } from "react";
import { trpc } from "../trpc/client";
import { Loader2, Plus, Archive, Sparkles, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ProjectSidebarProps {
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export function ProjectSidebar({ selectedProjectId, onSelectProject }: ProjectSidebarProps) {
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");

  const utils = trpc.useUtils();
  const { data: projects } = trpc.projects.getAll.useQuery();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => { 
      utils.projects.getAll.invalidate(); 
      setProjectName(""); 
      setProjectSlug(""); 
      toast.success("Project created successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to create project", { description: err.message });
    },
  });

  const archiveProject = trpc.projects.archive.useMutation({
    onSuccess: () => { 
      utils.projects.getAll.invalidate(); 
      onSelectProject("");
      toast.success("Project archived");
    },
  });

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-200 bg-clip-text text-transparent">Projects</h2>
      </div>
      
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        createProject.mutate({ name: projectName, slug: projectSlug }); 
      }} className="mb-6 space-y-3">
        <Input 
          placeholder="Project name" 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)} 
          className="h-9 text-sm bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm" 
          required 
        />
        <Input 
          placeholder="Slug (e.g. my-proj)" 
          value={projectSlug} 
          onChange={(e) => setProjectSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
          className="h-9 text-xs text-slate-500 bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm" 
          required 
        />
        <Button 
          type="submit" 
          size="sm" 
          className="w-full h-9 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all" 
          disabled={createProject.isPending}
        >
          {createProject.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
          Create Project
        </Button>
      </form>

      <Separator className="mb-4 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />

      <div className="flex-1 space-y-1 overflow-y-auto">
        {projects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-full p-3 mb-3">
              <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 px-4">Create your first project to get started</p>
          </div>
        ) : (
          projects?.map((project) => (
            <div
              key={project.id}
              className={`w-full rounded-lg text-sm transition-all flex items-center group ${
                selectedProjectId === project.id 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-slate-900 dark:text-slate-100 font-medium shadow-sm border border-blue-200/50 dark:border-blue-800/50" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
                className="flex flex-1 min-w-0 items-center gap-2 px-3 py-2.5 text-left"
              >
                <FolderKanban className={`h-4 w-4 shrink-0 ${selectedProjectId === project.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{project.name}</span>
              </button>
              <button
                type="button"
                onClick={() => { 
                  if (confirm("Archive this project?")) archiveProject.mutate({ projectId: project.id });
                }} 
                className="shrink-0 px-3 text-slate-300 transition-all hover:text-red-500 opacity-0 group-hover:opacity-100"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

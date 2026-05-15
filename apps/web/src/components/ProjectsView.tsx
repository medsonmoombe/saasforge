"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { FolderKanban, Plus, Archive, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useAuthContext } from "@/lib/auth-context";

interface Props {
  onOpenProject: (id: string) => void;
}

export function ProjectsView({ onOpenProject }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [showForm, setShowForm] = useState(false);
  const utils = trpc.useUtils();
  const { orgId } = useAuthContext();

  const { data: me } = trpc.auth.me.useQuery();
  const isAdmin = me?.orgs.find(o => o.id === orgId)?.role !== "member";

  const { data: projects, isLoading } = trpc.projects.getAll.useQuery();

  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.getAll.invalidate();
      toast.success("Project created!");
      setName(""); setSlug(""); setShowForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const archive = trpc.projects.archive.useMutation({
    onSuccess: () => { utils.projects.getAll.invalidate(); toast.success("Project archived"); },
  });

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All active projects in your organization</p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm((v) => !v)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Inline create form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Create a new project</h2>
            <form
              onSubmit={(e) => { e.preventDefault(); create.mutate({ name, slug }); }}
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
                <Input
                  placeholder="My Project"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-10"
                  autoFocus
                  required
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</label>
                <Input
                  placeholder="my-project"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="h-10 font-mono text-sm"
                  required
                />
              </div>
              <div className="flex gap-2 sm:self-end">
                <Button type="button" variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  type="submit"
                  className="h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={create.isPending}
                >
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Projects list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : !projects?.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <FolderKanban className="h-10 w-10 opacity-30" />
              <p className="text-sm">No projects yet. Create your first one above.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 shrink-0">
                    <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{project.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{project.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onOpenProject(project.id)}>
                      Open Board
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => { if (confirm("Archive this project?")) archive.mutate({ projectId: project.id }); }}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

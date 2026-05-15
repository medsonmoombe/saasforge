"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useAuthContext } from "@/lib/auth-context";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function OrgSetupModal({ open, onOpenChange }: Props) {
  const { setAuth, userId } = useAuthContext();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const createOrg = trpc.auth.createOrg.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, userId!, data.org?.id ?? null);
      utils.auth.me.invalidate();
      toast.success(`Organization "${data.org?.name}" created!`);
      onOpenChange(false);
    },
    onError: (err) => setError(err.message),
  });

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Name must be at least 2 characters");
    if (!/^[a-z0-9-]+$/.test(slug)) return setError("Slug can only contain lowercase letters, numbers, and hyphens");
    createOrg.mutate({ name: name.trim(), slug });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="px-8 pt-8 pb-10">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your organization</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This is your team's workspace</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Organization name
              </label>
              <Input
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Slug
              </label>
              <Input
                placeholder="acme-inc"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="h-11 font-mono text-sm"
              />
              <p className="text-xs text-slate-400">Used in URLs — lowercase, numbers, hyphens only</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold mt-2"
              disabled={createOrg.isPending}
            >
              {createOrg.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating...
                </span>
              ) : "Create Organization"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

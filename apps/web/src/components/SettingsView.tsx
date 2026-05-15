"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { useAuthContext } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Building2, Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { OrgSetupModal } from "./OrgSetupModal";

export function SettingsView() {
  const { orgId, setAuth, userId } = useAuthContext();
  const utils = trpc.useUtils();
  const { setSwitchingOrg } = useAuthContext();

  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: !!userId });
  const currentOrg = me?.orgs.find(o => o.id === orgId) ?? me?.orgs[0];
  const isOwner = currentOrg?.role === "owner";
  const canManage = currentOrg?.role === "owner" || currentOrg?.role === "admin";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  useEffect(() => {
    if (currentOrg) { setName(currentOrg.name); setSlug(currentOrg.slug); }
  }, [currentOrg]);

  const updateOrg = trpc.auth.updateOrg.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Organization updated!");
    },
    onError: (err) => toast.error(err.message),
  });

  const switchOrg = trpc.auth.switchOrg.useMutation({
    onMutate: () => setSwitchingOrg(true),
    onSuccess: (data, vars) => {
      setAuth(data.token, userId!, vars.orgId);
      // loader dismissed automatically when token change clears cache & re-renders
      setTimeout(() => setSwitchingOrg(false), 600);
    },
    onError: (err) => { setSwitchingOrg(false); toast.error(err.message); },
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your organization settings</p>
          </div>
        </div>

        {/* Org settings */}
        {currentOrg && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Organization</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${currentOrg.plan === "pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                {currentOrg.plan.toUpperCase()}
              </span>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); updateOrg.mutate({ name, slug }); }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organization Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10"
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="h-10 font-mono text-sm"
                  disabled={!isOwner}
                />
              </div>
              {isOwner && (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={updateOrg.isPending}
                >
                  {updateOrg.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              )}
              {!isOwner && (
                <p className="text-xs text-slate-400">Only the organization owner can edit these settings.</p>
              )}
            </form>
          </div>
        )}

        {/* Org switcher */}
        {me && me.orgs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your Organizations</h2>
              {canManage && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setCreateOrgOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New Org
              </Button>
              )}
            </div>
            <div className="space-y-2">
              {me.orgs.map((org) => (
                <div
                  key={org.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${org.id === orgId ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shrink-0">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{org.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{org.slug}</p>
                  </div>
                  {org.id === orgId ? (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Active</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={switchOrg.isPending}
                      onClick={() => switchOrg.mutate({ orgId: org.id })}
                    >
                      Switch
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <OrgSetupModal open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
    </div>
  );
}

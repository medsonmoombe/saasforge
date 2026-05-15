"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Crown, Shield, User } from "lucide-react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const roleIcon = { owner: Crown, admin: Shield, member: User };
const roleColor = { owner: "text-yellow-500", admin: "text-blue-500", member: "text-slate-400" };

export function TeamModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const { data: members, refetch } = trpc.auth.getMembers.useQuery(undefined, { enabled: open });

  const invite = trpc.auth.inviteUser.useMutation({
    onSuccess: () => {
      toast.success("User added to organization!");
      setEmail("");
      setError("");
      refetch();
    },
    onError: (err) => setError(err.message),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError("Enter a valid email");
    invite.mutate({ email });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-0 shadow-2xl">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="px-8 pt-8 pb-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Team Members</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your organization's team</p>
            </div>
          </div>

          {/* Invite form */}
          <form onSubmit={handleInvite} className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5 block">
              Invite by email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="h-10 flex-1"
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shrink-0"
                disabled={invite.isPending}
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add
              </Button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            <p className="mt-1.5 text-xs text-slate-400">The user must already have an account</p>
          </form>

          {/* Members list */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Members ({members?.length ?? 0})
            </p>
            {!members ? (
              <div className="text-sm text-slate-400 text-center py-4">Loading...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4">No members yet</div>
            ) : (
              members.map((m) => {
                const Icon = roleIcon[m.role];
                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium capitalize ${roleColor[m.role]}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {m.role}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

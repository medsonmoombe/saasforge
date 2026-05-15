"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Crown, Shield, User, Copy, Check, Loader2, Mail, Link2, Trash2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useAuthContext } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const roleIcon = { owner: Crown, admin: Shield, member: User };
const roleColor = { owner: "text-yellow-500", admin: "text-blue-500", member: "text-slate-400" };
const roleBg = { owner: "bg-yellow-50 dark:bg-yellow-950/30", admin: "bg-blue-50 dark:bg-blue-950/30", member: "bg-slate-50 dark:bg-slate-800/50" };

function MemberSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-48 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export function TeamView() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState("");
  const [inviteResult, setInviteResult] = useState<{ type: "added" | "invited"; inviteUrl: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const { userId } = useAuthContext();
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: !!userId });
  const { data: members, isLoading: membersLoading, refetch } = trpc.auth.getMembers.useQuery();

  const { orgId } = useAuthContext();
  const currentMember = members?.find(m => m.id === userId);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const invite = trpc.auth.inviteUser.useMutation({
    onSuccess: (data) => {
      setInviteResult(data);
      setEmail("");
      setError("");
      refetch();
      if (data.type === "added") toast.success("User added to organization!");
      else toast.success("Invite email sent!");
    },
    onError: (err) => setError(err.message),
  });

  const updateRole = trpc.auth.updateMemberRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Role updated"); },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.auth.removeMember.useMutation({
    onSuccess: () => { refetch(); toast.success("Member removed"); },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInviteResult(null);
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setError("Enter a valid email address");
    invite.mutate({ email, role });
  };

  const copyLink = async () => {
    if (!inviteResult?.inviteUrl) return;
    await navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Team</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage who has access to your organization</p>
          </div>
        </div>

        {/* Invite card — admin/owner only */}
        {canManage && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Invite a member</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Existing users are added instantly. New users receive an invite email.
          </p>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); setInviteResult(null); }}
              className="h-10 flex-1"
              disabled={invite.isPending}
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              disabled={invite.isPending}
              className="h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              type="submit"
              className="h-10 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shrink-0 min-w-[100px]"
              disabled={invite.isPending}
            >
              {invite.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </span>
              )}
            </Button>
          </form>

          {/* Validation error */}
          {error && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
              {error}
            </p>
          )}

          {/* Success result */}
          {inviteResult && (
            <div className={cn(
              "mt-4 rounded-lg border p-4",
              inviteResult.type === "added"
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            )}>
              {inviteResult.type === "added" ? (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    User added to the organization successfully.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Invite email sent! Backup link below:
                    </p>
                  </div>
                  {inviteResult.inviteUrl && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                        <Link2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <code className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          {inviteResult.inviteUrl}
                        </code>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 w-9 p-0 shrink-0 border-blue-200 dark:border-blue-800"
                        onClick={copyLink}
                        title="Copy link"
                      >
                        {copied
                          ? <Check className="h-3.5 w-3.5 text-green-500" />
                          : <Copy className="h-3.5 w-3.5 text-blue-500" />
                        }
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-blue-500 dark:text-blue-400">Expires in 7 days</p>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Members list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Members
              {!membersLoading && (
                <span className="ml-1.5 text-slate-400 font-normal">({members?.length ?? 0})</span>
              )}
            </h2>
            {membersLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>

          {membersLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3].map(i => <MemberSkeleton key={i} />)}
            </div>
          ) : !members?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-sm">No members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => {
                const Icon = roleIcon[m.role];
                const isMe = m.id === userId;
                const isOwner = m.role === "owner";
                return (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-bold shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{m.name}{isMe && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</p>
                    </div>
                    {canManage && !isMe && !isOwner ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => updateRole.mutate({ memberId: m.id, role: e.target.value as "admin" | "member" })}
                          disabled={updateRole.isPending}
                          className="h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 disabled:opacity-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => removeMember.mutate({ memberId: m.id })}
                          disabled={removeMember.isPending}
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-medium capitalize px-2.5 py-1 rounded-full shrink-0",
                        roleColor[m.role],
                        roleBg[m.role]
                      )}>
                        <Icon className="h-3 w-3" />
                        {m.role}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

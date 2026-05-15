"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useAuthContext } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, EyeOff, Loader2, XCircle, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Stage = "idle" | "submitting" | "redirecting";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { setAuth, userId } = useAuthContext();
  const router = useRouter();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("idle");

  const { data: invite, isLoading: inviteLoading, error: inviteError } = trpc.auth.getInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  useEffect(() => { if (invite?.email) setEmail(invite.email); }, [invite]);

  // Already logged in → redirect immediately
  useEffect(() => {
    if (userId) {
      setStage("redirecting");
      router.replace("/");
    }
  }, [userId, router]);

  const onSuccess = (data: { token: string; user?: { id: string } | null; orgId?: string | null }, msg: string) => {
    setStage("redirecting");
    setAuth(data.token, data.user?.id ?? "", data.orgId ?? null);
    toast.success(msg);
    router.replace("/");
  };

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => onSuccess(data, `Welcome! You've joined ${invite?.orgName}.`),
    onError: (err) => { setError(err.message); setStage("idle"); },
  });

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => onSuccess(data, `Welcome back! You've joined ${invite?.orgName}.`),
    onError: (err) => { setError(err.message); setStage("idle"); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register") {
      if (name.trim().length < 2) return setError("Name must be at least 2 characters");
      if (password.length < 8) return setError("Password must be at least 8 characters");
    }
    setStage("submitting");
    if (mode === "register") register.mutate({ email, name, password, inviteToken: token });
    else login.mutate({ email, password });
  };

  // ── Loading invite ──────────────────────────────────────────────
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validating invite...
        </div>
      </div>
    );
  }

  // ── Invalid invite ──────────────────────────────────────────────
  if (inviteError || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 mb-4">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Invalid Invite</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {inviteError?.message ?? "This invite link is invalid or has expired."}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            Go to homepage →
          </a>
        </div>
      </div>
    );
  }

  // ── Redirecting ─────────────────────────────────────────────────
  if (stage === "redirecting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shadow">
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          </span>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">You're in!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Redirecting to <strong>{invite.orgName}</strong>...
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────
  const isSubmitting = stage === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="px-8 pt-8 pb-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">You're invited!</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Join{" "}
              <strong className="text-slate-800 dark:text-slate-200">{invite.orgName}</strong>
              {" "}on SaaSForge as a{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 capitalize">
                {invite.role}
              </span>
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 mb-6">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                disabled={isSubmitting}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all disabled:opacity-50 ${
                  mode === m
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {m === "register" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3">
              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <Input
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-11 ${invite.email ? "pr-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400" : ""}`}
                  readOnly={!!invite.email}
                  disabled={isSubmitting}
                  required
                />
                {invite.email && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                )}
              </div>
              {invite.email && (
                <p className="text-xs text-slate-400">This email is tied to your invite and cannot be changed.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-50"
                  disabled={isSubmitting}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "register" ? "Creating account..." : "Signing in..."}
                </span>
              ) : mode === "register" ? "Create Account & Join" : "Sign In & Join"}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}

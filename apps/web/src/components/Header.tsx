"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, LogOut, ChevronDown, Eye, EyeOff, Sparkles, Mail, Lock, User, Building2, ChevronsUpDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationDrawer } from "./NotificationDrawer";
import { OrgSetupModal } from "./OrgSetupModal";
import { trpc } from "../trpc/client";
import { toast } from "sonner";

type AuthMode = "login" | "register";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

function AuthModal({ open, onOpenChange, initialMode }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode: AuthMode;
}) {
  const { setAuth } = useAuthContext();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    if (!open) {
      setEmail(""); setPassword(""); setName("");
      setErrors({}); setShowPassword(false);
    }
  }, [open]);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (mode === "register" && name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) next.email = "Enter a valid email address";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user.id, data.orgId ?? null);
      onOpenChange(false);
      toast.success(`Welcome back, ${data.user.name}!`);
    },
    onError: (err) => setErrors({ form: err.message }),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user?.id ?? "", null);
      onOpenChange(false);
      toast.success("Account created! Now set up your organization.");
      window.dispatchEvent(new CustomEvent("open-org-setup"));
    },
    onError: (err) => setErrors({ form: err.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ email, password, name });
  };

  const isPending = login.isPending || register.isPending;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-0 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

        <div className="px-8 pt-8 pb-10 overflow-y-auto">
          {/* Logo + heading */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Sign in to continue to SaaSForge"
                : "Start your free account today"}
            </p>
          </div>

          {/* Form-level error */}
          {errors.form && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3">
              <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">!</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    className={`pl-10 h-11 ${errors.name ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                  className={`pl-10 h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "register" ? "Min. 8 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  className={`pl-10 pr-10 h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-400/30" : ""}`}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all font-semibold mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline" onClick={() => switchMode("register")}>
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrgSwitcher({ orgs, currentOrgId, onSwitch }: {
  orgs: { id: string; name: string; slug: string }[];
  currentOrgId: string | null;
  onSwitch: (orgId: string, token: string) => void;
}) {
  const { setSwitchingOrg } = useAuthContext();
  const switchOrg = trpc.auth.switchOrg.useMutation({
    onMutate: () => setSwitchingOrg(true),
    onSuccess: (data, vars) => {
      onSwitch(vars.orgId, data.token);
      setTimeout(() => setSwitchingOrg(false), 600);
    },
    onError: () => setSwitchingOrg(false),
  });
  const current = orgs.find(o => o.id === currentOrgId) ?? orgs[0];
  if (!current) return null;
  if (orgs.length === 1) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
        <Building2 className="h-3.5 w-3.5" />
        {current.name}
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <Building2 className="h-3.5 w-3.5" />
          {current.name}
          <ChevronsUpDown className="h-3 w-3 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {orgs.map(org => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => org.id !== currentOrgId && switchOrg.mutate({ orgId: org.id })}
            className={`cursor-pointer ${org.id === currentOrgId ? "font-semibold text-blue-600 dark:text-blue-400" : ""}`}
          >
            <Building2 className="mr-2 h-3.5 w-3.5" />
            {org.name}
            {org.id === currentOrgId && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ onMenuClick, showMenu }: { onMenuClick: () => void; showMenu: boolean }) {
  const { userId, orgId, setAuth, clearAuth } = useAuthContext();
  const { setTheme, theme } = useTheme();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [orgSetupOpen, setOrgSetupOpen] = useState(false);

  useEffect(() => {
    const handler = () => { setAuthMode("register"); setAuthOpen(true); };
    const orgHandler = () => setOrgSetupOpen(true);
    window.addEventListener("open-auth-modal", handler);
    window.addEventListener("open-org-setup", orgHandler);
    return () => {
      window.removeEventListener("open-auth-modal", handler);
      window.removeEventListener("open-org-setup", orgHandler);
    };
  }, []);

  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: !!userId });

  useEffect(() => {
    if (me && me.orgs.length === 0) setOrgSetupOpen(true);
  }, [me]);

  const { data: userNotifications } = trpc.notifications.getMyNotifications.useQuery(undefined, {
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const unreadCount = userNotifications?.filter((n) => !n.read).length || 0;

  const openAuth = (mode: AuthMode) => { setAuthMode(mode); setAuthOpen(true); };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 shrink-0">
        <div className="flex items-center gap-2 lg:gap-4">
          {showMenu && (
            <button
              type="button"
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            SaaSForge
          </h1>
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <div className="hidden lg:block">
            {userId && me && me.orgs.length > 0 && (
              <OrgSwitcher orgs={me.orgs} currentOrgId={orgId} onSwitch={(id, token) => setAuth(token, userId!, id)} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userId && (
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"
              onClick={() => setNotificationOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 pl-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold shrink-0">
                    {me?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="text-sm hidden sm:block max-w-[120px] truncate">{me?.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{me?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{me?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAuth} className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuth("login")}>
                Sign In
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => openAuth("register")}>
                Get Started
              </Button>
            </div>
          )}
        </div>
      </header>

      {userId && (
        <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />
      )}

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      <OrgSetupModal open={orgSetupOpen} onOpenChange={setOrgSetupOpen} />
    </>
  );
}

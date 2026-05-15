"use client";

import { useAuthContext } from "@/lib/auth-context";

export function OrgSwitchLoader() {
  const { switchingOrg } = useAuthContext();
  if (!switchingOrg) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        {/* Animated logo mark */}
        <div className="relative">
          {/* Outer ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" className="animate-spin" style={{ animationDuration: "3s" }}>
            <circle cx="40" cy="40" r="36" fill="none" stroke="url(#ring-gradient)" strokeWidth="2" strokeDasharray="56 170" strokeLinecap="round" />
            <defs>
              <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {/* Inner ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}>
            <circle cx="40" cy="40" r="26" fill="none" stroke="url(#ring-gradient-2)" strokeWidth="2" strokeDasharray="32 130" strokeLinecap="round" />
            <defs>
              <linearGradient id="ring-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <p className="text-white font-semibold text-lg tracking-tight">Switching organization</p>
          <p className="text-slate-400 text-sm mt-1">Loading your workspace...</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

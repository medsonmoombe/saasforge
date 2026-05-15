"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Shield, Users } from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl">
              <Sparkles className="h-12 w-12 text-white animate-spin-slow" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent text-center">
          SaaSForge
        </h1>

        <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">
          Enterprise Task Management, Reimagined
        </p>

        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto text-center">
          Build, collaborate, and ship faster with the most powerful multi-tenant SaaS platform.
          Designed for teams that demand excellence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-blue-100 dark:bg-blue-950 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">Lightning Fast</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Optimistic updates and real-time collaboration keep your team in sync</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-indigo-100 dark:bg-indigo-950 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">Enterprise Security</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Row-level security and multi-tenant isolation built from the ground up</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="bg-purple-100 dark:bg-purple-950 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">Team Collaboration</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Kanban boards, assignments, and notifications that actually work</p>
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all"
            onClick={() => window.dispatchEvent(new CustomEvent("open-auth-modal"))}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6">
            No credit card required • Free forever for small teams
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

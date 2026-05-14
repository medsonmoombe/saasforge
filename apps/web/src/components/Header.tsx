"use client";

import { useState } from "react";
import { UserButton, OrganizationSwitcher, SignInButton, useAuth } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationDrawer } from "./NotificationDrawer";
import { trpc } from "../trpc/client";

export function Header() {
  const { userId } = useAuth();
  const { setTheme, theme } = useTheme();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const { data: userNotifications } = trpc.notifications.getMyNotifications.useQuery(undefined, {
    enabled: !!userId,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  const unreadCount = userNotifications?.filter(n => !n.read).length || 0;

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">SaaSForge</h1>
          <Separator orientation="vertical" className="h-6" />
          {userId && (
            <OrganizationSwitcher 
              hidePersonal 
              appearance={{ elements: { organizationSwitcherTrigger: "rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all" } }}
            />
          )}
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

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {userId ? (
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          ) : (
            <SignInButton mode="modal">
              <Button size="sm">Sign In</Button>
            </SignInButton>
          )}
        </div>
      </header>

      {userId && (
        <NotificationDrawer 
          open={notificationOpen} 
          onClose={() => setNotificationOpen(false)} 
        />
      )}
    </>
  );
}

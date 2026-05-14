"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { trpc } from "../trpc/client";
import { toast } from "sonner";



interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const utils = trpc.useUtils();
  const { data: notifications } = trpc.notifications.getMyNotifications.useQuery();
  
  const markAllRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getMyNotifications.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent className="sm:max-w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-800/60 flex flex-col">
        <SheetHeader className="border-b border-slate-200/60 dark:border-slate-800/60 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-slate-100 dark:to-blue-100 bg-clip-text text-transparent">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || unreadCount === 0}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto space-y-1 px-1">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-full p-4 mb-4">
                <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group relative p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                  notification.read
                    ? "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur-sm border-blue-200/60 dark:border-blue-900/60 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm mb-1 ${
                      notification.read 
                        ? "text-slate-700 dark:text-slate-300" 
                        : "text-slate-900 dark:text-slate-100 font-medium"
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3 text-slate-400 hover:text-red-500" />
                  </Button>
                </div>
                {!notification.read && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-4">
          <Button variant="outline" className="w-full hover:bg-slate-50/50 dark:hover:bg-slate-800/50" size="sm">
            View All Notifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

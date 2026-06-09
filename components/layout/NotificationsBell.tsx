// components/layout/NotificationsBell.tsx
"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Notification } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationsBell({ notifications, unreadCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) {
        console.error("Failed to mark notification as read:", id);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unread.map((n) => n.id) }),
      });
      if (!res.ok) {
        console.error("Failed to mark all notifications as read");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-muted hover:text-ink rounded-lg hover:bg-surface-3 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-surface-2 border border-border rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-ink text-sm">Notifications</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-muted hover:text-ink rounded transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted text-sm">
                No notifications yet 🎉
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-surface-3",
                    !notif.isRead && "bg-accent/5"
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-ink truncate">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-dim mt-1">
                        {getRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <button
                onClick={() => router.push("/notifications")}
                className="text-xs text-accent hover:text-accent-dim font-medium"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close on outside click */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function getRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// components/layout/TopBar.tsx
"use client";

import { useSession } from "next-auth/react";
import { NotificationsBell } from "./NotificationsBell";
import { useNotifications } from "@/hooks/useNotifications";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "";
  const { notifications, unread } = useNotifications();

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        {title && <h1 className="text-2xl font-semibold text-ink">{title}</h1>}
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell notifications={notifications} unreadCount={unread.length} />
        {name && (
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

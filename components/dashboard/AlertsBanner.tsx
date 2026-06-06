// components/dashboard/AlertsBanner.tsx
"use client";

import { Bell, X } from "lucide-react";
import { useState } from "react";
import { Notification } from "@/types";

export function AlertsBanner({ notifications }: { notifications: Notification[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !notifications.length) return null;

  return (
    <div className="bg-surface-2 border border-warning/30 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Bell className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            {notifications.slice(0, 3).map((n) => (
              <p key={n.id} className="text-sm text-ink">
                <span className="text-warning font-medium">{n.title}</span>
                {" — "}
                <span className="text-muted">{n.message}</span>
              </p>
            ))}
            {notifications.length > 3 && (
              <p className="text-xs text-muted">+{notifications.length - 3} more alerts</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted hover:text-ink transition-colors"
          aria-label="Dismiss alerts"
          title="Dismiss alerts"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

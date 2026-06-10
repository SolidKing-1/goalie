// hooks/useNotifications.ts
"use client";
import { useState, useEffect } from "react";
import { Notification } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/notifications");
    setNotifications(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    await load();
  };

  const markRead = async (ids: string[]) => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    await load();
  };

  const unread = notifications.filter((n) => !n.isRead);

  return { notifications, unread, loading, markAllRead, markRead, refetch: load };
}

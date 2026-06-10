// hooks/useSubscriptions.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { Subscription } from "@/types";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch");
      setSubscriptions(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const create = async (data: Partial<Subscription>) => {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    await fetch_();
    return res.json();
  };

  const update = async (id: string, data: Partial<Subscription>) => {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    await fetch_();
  };

  const remove = async (id: string) => {
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    await fetch_();
  };

  return { subscriptions, loading, error, refetch: fetch_, create, update, remove };
}

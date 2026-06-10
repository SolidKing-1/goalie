// hooks/useBudget.ts
"use client";
import { useState, useEffect } from "react";
import { Budget, Subscription } from "@/types";
import { toMonthly } from "@/lib/utils";

export function useBudget() {
  const [budget, setBudget]               = useState<Budget | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading]             = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/budget");
    const data = await res.json();
    setBudget(data.budget);
    setSubscriptions(data.subscriptions);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalMonthly = subscriptions.reduce(
    (s, sub) => s + toMonthly(sub.cost, sub.billingCycle), 0
  );

  const save = async (payload: { monthlyLimit: number; alertAt: number }) => {
    await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load();
  };

  return { budget, subscriptions, totalMonthly, loading, save, refetch: load };
}

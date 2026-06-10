// hooks/useGoals.ts
"use client";
import { useState, useEffect } from "react";
import { Goal, GoalAlignmentResult } from "@/types";

export function useGoals() {
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [alignment, setAlignment]   = useState<GoalAlignmentResult[]>([]);
  const [loading, setLoading]       = useState(true);
  const [analyzing, setAnalyzing]   = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (data: { title: string; description?: string; category: string; targetDate?: string }) => {
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create goal");
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await load();
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/goals/alignment");
      setAlignment(await res.json());
    } finally {
      setAnalyzing(false);
    }
  };

  return { goals, alignment, loading, analyzing, create, remove, analyze, refetch: load };
}

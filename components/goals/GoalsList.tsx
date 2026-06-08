// components/goals/GoalsList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Goal, GoalCategory } from "@/types";
import { Plus, Target, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<GoalCategory, string> = {
  CAREER: "💼", EDUCATION: "📚", HEALTH: "💪",
  FINANCE: "💰", LIFESTYLE: "✨", OTHER: "🎯",
};

export function GoalsList({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "CAREER" as GoalCategory });
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to create goal");
        return;
      }
      router.refresh();
      setShowForm(false);
      setForm({ title: "", description: "", category: "CAREER" });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Failed to delete goal");
        return;
      }
      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Your Goals</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-dim transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Goal
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGoal} className="card space-y-3 animate-slide-up">
          <input
            type="text"
            placeholder="Goal title (e.g. Get an internship)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors"
          />
          <select
            aria-label="Goal category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          >
            {(["CAREER","EDUCATION","HEALTH","FINANCE","LIFESTYLE","OTHER"] as GoalCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors resize-none"
          />
          {error && (
            <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{typeof error === "object" ? JSON.stringify(error) : error}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted hover:text-ink transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-accent text-surface text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50">
              {saving ? "Adding…" : "Add Goal"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.id} className="card p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">{CATEGORY_ICONS[goal.category]}</span>
              <div>
                <p className="text-sm font-medium text-ink">{goal.title}</p>
                {goal.description && (
                  <p className="text-xs text-muted mt-0.5">{goal.description}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  {(goal.subscriptions?.length ?? 0)} subscription{goal.subscriptions?.length !== 1 ? "s" : ""} linked
                </p>
              </div>
            </div>
            <button
              onClick={() => deleteGoal(goal.id)}
              title="Delete goal"
              aria-label="Delete goal"
              className="text-muted hover:text-danger transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {!goals.length && (
          <div className="card p-8 text-center">
            <Target className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">Add your first goal to get AI-powered subscription recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
}

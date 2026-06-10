// components/goals/GoalsList.tsx
"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { Goal, GoalCategory } from "@/types";
import {
  Button,
  Empty,
  Skeleton,
  Modal,
  Input,
  Select,
  Badge,
} from "@/components/ui/index";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Target, Calendar } from "lucide-react";

const CATEGORY_META: Record<GoalCategory, { emoji: string; label: string }> = {
  CAREER: { emoji: "💼", label: "Career" },
  EDUCATION: { emoji: "📚", label: "Education" },
  HEALTH: { emoji: "💪", label: "Health" },
  FINANCE: { emoji: "💰", label: "Finance" },
  LIFESTYLE: { emoji: "✨", label: "Lifestyle" },
  OTHER: { emoji: "🎯", label: "Other" },
};

const GOAL_CATEGORIES = (Object.keys(CATEGORY_META) as GoalCategory[]).map(
  (v) => ({
    value: v,
    label: `${CATEGORY_META[v].emoji} ${CATEGORY_META[v].label}`,
  }),
);

const STATUS_BADGE: Record<string, "success" | "warning" | "neutral"> = {
  ACTIVE: "success",
  ACHIEVED: "info" as any,
  PAUSED: "warning",
};

function AddGoalModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "CAREER" as GoalCategory,
    targetDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required");
    setLoading(true);
    try {
      await onCreate({
        ...form,
        targetDate: form.targetDate
          ? new Date(form.targetDate).toISOString()
          : undefined,
      });
      onClose();
    } catch {
      setError("Failed to create goal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Add Goal" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Goal title *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Get a software engineering internship"
        />
        <Select
          label="Category"
          value={form.category}
          onChange={(e) =>
            setForm((f) => ({ ...f, category: e.target.value as GoalCategory }))
          }
          options={GOAL_CATEGORIES}
        />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">
            Description (optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={2}
            placeholder="What does achieving this look like?"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors placeholder:text-muted/50 resize-none"
          />
        </div>
        <Input
          label="Target date (optional)"
          type="date"
          value={form.targetDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, targetDate: e.target.value }))
          }
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Add Goal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function GoalsList() {
  const { goals, loading, create, remove } = useGoals();
  const [showForm, setShowForm] = useState(false);

  if (loading)
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
          Your Goals
        </h2>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <Empty
            icon={Target}
            title="No goals yet"
            description="Add a goal to get AI-powered subscription recommendations"
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Goal
              </Button>
            }
          />
        </div>
      ) : (
        /* ── ADJUSTED SPACING CONTAINER ── */
        <div className="space-y-4">
          {goals.map((goal) => {
            const meta = CATEGORY_META[goal.category];
            const subCount = goal.subscriptions?.length ?? 0;
            return (
              <div
                key={goal.id}
                className="card p-4 flex items-start justify-between gap-3 group hover:border-accent/30 transition-colors"
              >
                <div className="flex gap-3">
                  <span className="text-2xl mt-0.5">{meta.emoji}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink">
                        {goal.title}
                      </p>
                      <Badge
                        label={goal.status.toLowerCase()}
                        variant={STATUS_BADGE[goal.status]}
                      />
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted">{meta.label}</span>
                      {goal.targetDate && (
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Calendar className="w-3 h-3" />
                          {new Date(goal.targetDate).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" },
                          )}
                        </span>
                      )}
                      {subCount > 0 && (
                        <span className="text-xs text-accent">
                          {subCount} sub{subCount !== 1 ? "s" : ""} linked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => remove(goal.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all p-1 rounded flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <AddGoalModal onClose={() => setShowForm(false)} onCreate={create} />
      )}
    </div>
  );
}

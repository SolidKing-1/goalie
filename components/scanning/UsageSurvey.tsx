// components/scanning/UsageSurvey.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Subscription, UsageLevel } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  subscriptions: Subscription[];
  existingSurvey: any;
}

const USAGE_OPTIONS: { value: UsageLevel; label: string; desc: string; color: string }[] = [
  { value: "DAILY",  label: "Daily",  desc: "Use almost every day",    color: "border-success text-success" },
  { value: "WEEKLY", label: "Weekly", desc: "Use a few times a week",  color: "border-info text-info" },
  { value: "RARELY", label: "Rarely", desc: "Use once a month or less", color: "border-warning text-warning" },
  { value: "NEVER",  label: "Never",  desc: "Haven't used it at all",  color: "border-danger text-danger" },
];

export function UsageSurvey({ subscriptions, existingSurvey }: Props) {
  const router = useRouter();
  const [usage, setUsage] = useState<Record<string, UsageLevel>>(
    existingSurvey?.entries.reduce((acc: any, e: any) => {
      acc[e.subscriptionId] = e.usageLevel;
      return acc;
    }, {}) ?? {}
  );
  const [saving, setSaving] = useState(false);

  const allAnswered = subscriptions.every((s) => usage[s.id]);

  async function submit() {
    setSaving(true);
    try {
      await fetch("/api/scanning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: Object.entries(usage).map(([subscriptionId, usageLevel]) => ({
            subscriptionId,
            usageLevel,
          })),
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!subscriptions.length) {
    return <p className="text-muted text-sm">Add subscriptions first to rate your usage.</p>;
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="py-3 border-b border-border last:border-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-ink">{sub.name}</p>
              <p className="text-xs text-muted capitalize">{sub.category.toLowerCase()}</p>
            </div>
            <span className="text-xs font-mono text-muted">${sub.cost}/{sub.billingCycle.toLowerCase()}</span>
          </div>
          <div className="flex gap-2">
            {USAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUsage((u) => ({ ...u, [sub.id]: opt.value }))}
                className={cn(
                  "flex-1 py-2 px-1 rounded-lg border text-xs font-medium transition-all text-center",
                  usage[sub.id] === opt.value
                    ? opt.color + " bg-surface-3"
                    : "border-border text-muted hover:border-ink/30 hover:text-ink"
                )}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5 hidden sm:block">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={submit}
        disabled={saving || !allAnswered}
        className="w-full bg-accent text-surface py-2.5 rounded-lg text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50 mt-2"
      >
        {saving ? "Saving…" : existingSurvey ? "Update Survey" : "Submit Survey"}
      </button>
      {!allAnswered && (
        <p className="text-xs text-muted text-center">Rate all subscriptions to submit</p>
      )}
    </div>
  );
}

// components/scanning/UsageSurvey.tsx
"use client";

import { useState, useEffect } from "react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { UsageLevel } from "@/types";
import { Button, Skeleton, Empty } from "@/components/ui/index";
import { formatCurrency, toMonthly } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CreditCard, CheckCircle, RotateCcw } from "lucide-react";

const LEVELS: { value: UsageLevel; label: string; desc: string; color: string; bg: string }[] = [
  { value: "DAILY",  label: "Daily",  desc: "Every day",       color: "border-success text-success",  bg: "bg-success/10"  },
  { value: "WEEKLY", label: "Weekly", desc: "Few times/week",  color: "border-info text-info",        bg: "bg-info/10"     },
  { value: "RARELY", label: "Rarely", desc: "Once/month",      color: "border-warning text-warning",  bg: "bg-warning/10"  },
  { value: "NEVER",  label: "Never",  desc: "Not at all",      color: "border-danger text-danger",    bg: "bg-danger/10"   },
];

interface SurveyData { survey: any; month: number; year: number }

export function UsageSurvey() {
  const { subscriptions, loading: subsLoading } = useSubscriptions();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [usage, setUsage]   = useState<Record<string, UsageLevel>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  // Load existing survey
  useEffect(() => {
    fetch("/api/scanning")
      .then((r) => r.json())
      .then((data) => {
        setSurveyData(data);
        if (data.survey?.entries) {
          const map: Record<string, UsageLevel> = {};
          for (const e of data.survey.entries) map[e.subscriptionId] = e.usageLevel;
          setUsage(map);
          setDone(true);
        }
      })
      .finally(() => setSurveyLoading(false));
  }, []);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE");
  const allAnswered = activeSubscriptions.length > 0 && activeSubscriptions.every((s) => usage[s.id]);
  const answeredCount = activeSubscriptions.filter((s) => usage[s.id]).length;

  async function submit() {
    setSaving(true);
    try {
      await fetch("/api/scanning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: Object.entries(usage).map(([subscriptionId, usageLevel]) => ({ subscriptionId, usageLevel })),
        }),
      });
      setDone(true);
      // Refresh survey data
      const res = await fetch("/api/scanning");
      setSurveyData(await res.json());
    } finally {
      setSaving(false);
    }
  }

  if (subsLoading || surveyLoading) return <Skeleton className="h-48 w-full" />;
  if (activeSubscriptions.length === 0) return (
    <Empty icon={CreditCard} title="No active subscriptions" description="Add subscriptions to rate your usage" />
  );

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const month = surveyData?.month ?? new Date().getMonth() + 1;
  const year  = surveyData?.year  ?? new Date().getFullYear();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink">
            Monthly Survey — {MONTH_NAMES[month - 1]} {year}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {answeredCount} of {activeSubscriptions.length} rated
          </p>
        </div>
        {done && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs text-success font-medium">Submitted</span>
            <button onClick={() => setDone(false)} className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Edit
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${activeSubscriptions.length > 0 ? (answeredCount / activeSubscriptions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Subscription rows */}
      <div className="space-y-4">
        {activeSubscriptions.map((sub) => (
          <div key={sub.id} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{sub.name}</p>
                <p className="text-xs text-muted capitalize">
                  {sub.category.toLowerCase()} · {formatCurrency(toMonthly(sub.cost, sub.billingCycle))}/mo
                </p>
              </div>
              {usage[sub.id] && (
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((lvl) => {
                const selected = usage[sub.id] === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    onClick={() => !done && setUsage((u) => ({ ...u, [sub.id]: lvl.value }))}
                    disabled={done}
                    className={cn(
                      "py-2 px-1 rounded-lg border text-center transition-all",
                      selected
                        ? cn(lvl.color, lvl.bg, "font-medium")
                        : "border-border text-muted hover:border-ink/30 hover:text-ink disabled:cursor-default"
                    )}
                  >
                    <p className="text-xs font-medium">{lvl.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5 hidden sm:block">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      {!done && (
        <Button
          onClick={submit}
          loading={saving}
          disabled={!allAnswered}
          className="w-full"
        >
          {allAnswered ? "Submit Survey" : `Rate all ${activeSubscriptions.length - answeredCount} remaining`}
        </Button>
      )}
    </div>
  );
}

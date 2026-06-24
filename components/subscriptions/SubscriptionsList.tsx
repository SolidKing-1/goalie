// components/subscriptions/SubscriptionsList.tsx
"use client";

import { useState, useMemo } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Subscription, SubscriptionStatus, Goal } from "@/types";
import { SubscriptionForm } from "./SubscriptionForm";
import { Button, Badge, Empty, Skeleton } from "@/components/ui/index";
import {
  formatCurrency,
  toMonthly,
  formatRelativeDate,
  daysUntil,
  CATEGORY_COLORS,
  BILLING_CYCLE_LABELS,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";

const STATUS_BADGE: Record<
  SubscriptionStatus,
  "success" | "warning" | "neutral"
> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "neutral",
};

type SortKey = "renewalDate" | "cost" | "name" | "category";

interface SubscriptionsListProps {
  initialSubscriptions: Subscription[];
  initialGoals: Goal[];
}

export function SubscriptionsList({
  initialSubscriptions,
  initialGoals,
}: SubscriptionsListProps) {
  // Use client hooks but fall back to initial server data if needed
  const {
    subscriptions: hookSubs,
    loading,
    create,
    update,
    remove,
  } = useSubscriptions();
  const { goals: hookGoals } = useGoals();

  // Prefer active hook sync state, fallback to instant server payload data
  const subscriptions = hookSubs.length > 0 ? hookSubs : initialSubscriptions;
  const goals = hookGoals.length > 0 ? hookGoals : initialGoals;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [filter, setFilter] = useState<SubscriptionStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("renewalDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = subscriptions || [];
    if (filter !== "ALL") list = list.filter((s) => s.status === filter);
    if (search)
      list = list.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      );

    return [...list].sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === "renewalDate") {
        av = new Date(a.renewalDate).getTime();
        bv = new Date(b.renewalDate).getTime();
      } else if (sortKey === "cost") {
        av = toMonthly(Number(a.cost), a.billingCycle as any);
        bv = toMonthly(Number(b.cost), b.billingCycle as any);
      } else if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      } else {
        av = a.category;
        bv = b.category;
      }
      return sortAsc ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
  }, [subscriptions, filter, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription? This cannot be undone.")) return;
    setDeleting(id);
    await remove(id);
    setDeleting(null);
  }

  const totalMonthly = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce(
      (sum, s) => sum + toMonthly(Number(s.cost), s.billingCycle as any),
      0,
    );

  if (loading && subscriptions.length === 0)
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );

  return (
    <div className="space-y-5">
      {/* ── SINGLE UNIFIED HEADER ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Subscriptions</h1>
          <p className="text-muted mt-0.5 text-sm">
            {subscriptions.filter((s) => s.status === "ACTIVE").length} active ·{" "}
            <span className="text-accent font-mono">
              {formatCurrency(totalMonthly)}/mo
            </span>
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscriptions…"
            className="w-full bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
        </div>
        {/* Status filter */}
        <div className="flex gap-1.5">
          {(["ALL", "ACTIVE", "PAUSED", "CANCELLED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filter === f
                  ? "bg-accent text-surface"
                  : "text-muted hover:text-ink hover:bg-surface-3",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <Empty
            icon={Search}
            title="No subscriptions found"
            description={
              search
                ? "Try a different search term"
                : "Add your first subscription to get started"
            }
            action={
              !search ? (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add Subscription
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: "name" as SortKey, label: "Name" },
                  { key: "category" as SortKey, label: "Category" },
                  { key: "cost" as SortKey, label: "Cost/Month" },
                  { key: "renewalDate" as SortKey, label: "Renews" },
                ].map(({ key, label }) => (
                  <th key={key} className="text-left px-5 py-3">
                    <button
                      onClick={() => toggleSort(key)}
                      className="flex items-center gap-1 text-xs font-medium text-muted hover:text-ink transition-colors"
                    >
                      {label}
                      <ArrowUpDown
                        className={cn(
                          "w-3 h-3",
                          sortKey === key && "text-accent",
                        )}
                      />
                    </button>
                  </th>
                ))}
                <th className="text-left px-5 py-3 text-xs font-medium text-muted">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted">
                  Goal
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const days = daysUntil(sub.renewalDate);
                const monthly = toMonthly(
                  Number(sub.cost),
                  sub.billingCycle as any,
                );
                const goal = goals?.find((g) => g.id === sub.goalId);
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-surface-3/40 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              CATEGORY_COLORS[
                                sub.category as keyof typeof CATEGORY_COLORS
                              ] ?? "#6b7280",
                          }}
                        />
                        <div>
                          <p className="font-medium text-ink">{sub.name}</p>
                          {sub.description && (
                            <p className="text-xs text-muted truncate max-w-[180px]">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-3.5 text-muted text-xs capitalize">
                      {sub.category?.toLowerCase()}
                    </td>
                    {/* Cost */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-accent">
                        {formatCurrency(monthly)}
                      </span>
                      <span className="text-xs text-muted ml-1">
                        {BILLING_CYCLE_LABELS[
                          sub.billingCycle as keyof typeof BILLING_CYCLE_LABELS
                        ] !== "Monthly"
                          ? `(${formatCurrency(Number(sub.cost))} ${BILLING_CYCLE_LABELS[sub.billingCycle as keyof typeof BILLING_CYCLE_LABELS]?.toLowerCase()})`
                          : ""}
                      </span>
                    </td>
                    {/* Renewal */}
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-xs",
                          days <= 0
                            ? "text-danger"
                            : days <= 3
                              ? "text-warning"
                              : "text-muted",
                        )}
                      >
                        {formatRelativeDate(sub.renewalDate)}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge
                        label={sub.status.toLowerCase()}
                        variant={STATUS_BADGE[sub.status]}
                      />
                    </td>
                    {/* Goal */}
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {goal?.title ?? "—"}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {(sub.usageLevel === "RARELY" ||
                          sub.usageLevel === "NEVER") && (
                          <span
                            title="Rarely used"
                            className="flex items-center"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-warning" />
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditing(sub)}
                          aria-label="Edit item"
                          className="p-1 text-muted hover:text-ink rounded transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleting === sub.id}
                          aria-label="Delete item"
                          className="p-1 text-muted hover:text-danger rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <SubscriptionForm
          mode="create"
          goals={goals}
          onClose={() => setShowForm(false)}
          onSave={(data) => create(data)}
        />
      )}

      {/* Edit form */}
      {editing && (
        <SubscriptionForm
          mode="edit"
          subscription={editing}
          goals={goals}
          onClose={() => setEditing(null)}
          onSave={(data) => update(editing.id, data)}
        />
      )}
    </div>
  );
}

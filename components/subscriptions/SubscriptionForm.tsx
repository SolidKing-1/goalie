// components/subscriptions/SubscriptionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Goal, Subscription } from "@/types";

const CATEGORIES = [
  "STREAMING","SOFTWARE","FITNESS","EDUCATION",
  "FOOD","FINANCE","GAMING","PRODUCTIVITY","NEWS","OTHER",
];
const CYCLES = ["WEEKLY","MONTHLY","QUARTERLY","YEARLY"];

interface Props {
  mode: "create" | "edit";
  subscription?: Subscription;
  goals: Goal[];
  onClose: () => void;
}

export function SubscriptionForm({ mode, subscription, goals, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: subscription?.name ?? "",
    description: subscription?.description ?? "",
    cost: String(subscription?.cost ?? ""),
    billingCycle: subscription?.billingCycle ?? "MONTHLY",
    renewalDate: subscription?.renewalDate
      ? new Date(subscription.renewalDate).toISOString().slice(0, 10)
      : "",
    category: subscription?.category ?? "OTHER",
    notifyDaysBefore: String(subscription?.notifyDaysBefore ?? "3"),
    goalId: subscription?.goalId ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        cost: parseFloat(form.cost),
        notifyDaysBefore: parseInt(form.notifyDaysBefore),
        renewalDate: new Date(form.renewalDate).toISOString(),
        goalId: form.goalId || undefined,
      };

      const url = mode === "create"
        ? "/api/subscriptions"
        : `/api/subscriptions/${subscription!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      router.refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-2 border border-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-ink">
            {mode === "create" ? "Add Subscription" : "Edit Subscription"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
              placeholder="Netflix"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost ($)" required>
              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", e.target.value)}
                className="input"
                placeholder="15.99"
                required
              />
            </Field>
            <Field label="Billing Cycle">
              <select value={form.billingCycle} onChange={(e) => set("billingCycle", e.target.value)} className="input">
                {CYCLES.map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Next Renewal Date" required>
            <input
              type="date"
              value={form.renewalDate}
              onChange={(e) => set("renewalDate", e.target.value)}
              className="input"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </Field>
            <Field label="Remind me (days before)">
              <input
                type="number"
                min="1" max="30"
                value={form.notifyDaysBefore}
                onChange={(e) => set("notifyDaysBefore", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {goals.length > 0 && (
            <Field label="Link to Goal (optional)">
              <select value={form.goalId} onChange={(e) => set("goalId", e.target.value)} className="input">
                <option value="">No goal</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted hover:text-ink hover:border-ink/30 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-accent text-surface text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50">
              {loading ? "Saving…" : mode === "create" ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: var(--color-surface-3);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-ink);
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: var(--color-accent); }
        .input option { background: var(--color-surface-2); }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted">
        {label}{required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

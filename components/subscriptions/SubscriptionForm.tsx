// components/subscriptions/SubscriptionForm.tsx
"use client";

import { useState } from "react";
import { Goal, Subscription, BillingCycle, SubscriptionCategory } from "@/types";
import { Modal, Button, Input, Select } from "@/components/ui/index";

const CATEGORIES: { value: SubscriptionCategory; label: string }[] = [
  { value: "STREAMING",    label: "🎬 Streaming"    },
  { value: "SOFTWARE",     label: "💻 Software"     },
  { value: "FITNESS",      label: "💪 Fitness"      },
  { value: "EDUCATION",    label: "📚 Education"    },
  { value: "FOOD",         label: "🍔 Food"         },
  { value: "FINANCE",      label: "💰 Finance"      },
  { value: "GAMING",       label: "🎮 Gaming"       },
  { value: "PRODUCTIVITY", label: "⚡ Productivity" },
  { value: "NEWS",         label: "📰 News"         },
  { value: "OTHER",        label: "📦 Other"        },
];

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "WEEKLY",    label: "Weekly"    },
  { value: "MONTHLY",   label: "Monthly"   },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY",    label: "Yearly"    },
];

interface Props {
  mode: "create" | "edit";
  subscription?: Subscription;
  goals: Goal[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function SubscriptionForm({ mode, subscription, goals, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    name:             subscription?.name ?? "",
    description:      subscription?.description ?? "",
    cost:             String(subscription?.cost ?? ""),
    billingCycle:     (subscription?.billingCycle ?? "MONTHLY") as BillingCycle,
    renewalDate:      subscription?.renewalDate
                        ? new Date(subscription.renewalDate).toISOString().slice(0, 10)
                        : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    category:         (subscription?.category ?? "OTHER") as SubscriptionCategory,
    notifyDaysBefore: String(subscription?.notifyDaysBefore ?? "3"),
    goalId:           subscription?.goalId ?? "",
    websiteUrl:       subscription?.websiteUrl ?? "",
  });

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim())        return setError("Name is required");
    if (!form.cost || isNaN(+form.cost) || +form.cost <= 0) return setError("Valid cost is required");
    setLoading(true);
    try {
      await onSave({
        ...form,
        cost:             parseFloat(form.cost),
        notifyDaysBefore: parseInt(form.notifyDaysBefore),
        renewalDate:      new Date(form.renewalDate).toISOString(),
        goalId:           form.goalId || undefined,
        websiteUrl:       form.websiteUrl || undefined,
        description:      form.description || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={mode === "create" ? "Add Subscription" : "Edit Subscription"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Name *"
          value={form.name}
          onChange={set("name")}
          placeholder="Netflix, Spotify…"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cost *"
            type="number"
            step="0.01"
            min="0.01"
            value={form.cost}
            onChange={set("cost")}
            placeholder="9.99"
            required
          />
          <Select
            label="Billing Cycle"
            value={form.billingCycle}
            onChange={set("billingCycle")}
            options={CYCLES}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={set("category")}
            options={CATEGORIES}
          />
          <Input
            label="Next Renewal *"
            type="date"
            value={form.renewalDate}
            onChange={set("renewalDate")}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Notify (days before)"
            type="number"
            min="1"
            max="30"
            value={form.notifyDaysBefore}
            onChange={set("notifyDaysBefore")}
          />
          <Input
            label="Website URL (optional)"
            type="url"
            value={form.websiteUrl}
            onChange={set("websiteUrl")}
            placeholder="https://…"
          />
        </div>

        {goals.length > 0 && (
          <Select
            label="Link to Goal (optional)"
            value={form.goalId}
            onChange={set("goalId")}
            options={[{ value: "", label: "No goal linked" }, ...goals.map((g) => ({ value: g.id, label: g.title }))]}
          />
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted">Notes (optional)</label>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={2}
            placeholder="Any notes…"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors placeholder:text-muted/50 resize-none"
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" type="submit" loading={loading} className="flex-1">
            {mode === "create" ? "Add Subscription" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

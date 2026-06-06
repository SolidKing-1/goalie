// components/subscriptions/AddSubscriptionButton.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Goal } from "@/types";
import { SubscriptionForm } from "./SubscriptionForm";

export function AddSubscriptionButton({ goals }: { goals: Goal[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-accent text-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-dim transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Subscription
      </button>

      {open && (
        <SubscriptionForm
          mode="create"
          goals={goals}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

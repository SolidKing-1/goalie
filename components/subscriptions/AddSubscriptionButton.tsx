// components/subscriptions/AddSubscriptionButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Goal } from "@/types";
import { SubscriptionForm } from "./SubscriptionForm";

export function AddSubscriptionButton({ goals }: { goals: Goal[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Fixes: Change signature to accept 'data' and handle it asynchronously
  const handleSave = async (data: any) => {
    // If your form handles the actual API request internally,
    // you just need to refresh the page state and close the modal here:
    router.refresh();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
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
          onSave={handleSave} // TypeScript is now happy!
        />
      )}
    </>
  );
}

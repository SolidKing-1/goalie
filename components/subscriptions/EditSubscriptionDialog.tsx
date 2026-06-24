// components/subscriptions/EditSubscriptionDialog.tsx
"use client";

import { useRouter } from "next/navigation"; // Imported to refresh data after editing
import { Subscription, Goal } from "@/types";
import { SubscriptionForm } from "./SubscriptionForm";

interface Props {
  subscription: Subscription;
  goals: Goal[];
  onClose: () => void;
}

export function EditSubscriptionDialog({
  subscription,
  goals,
  onClose,
}: Props) {
  const router = useRouter();

  // Fixes: Handles the data submission asynchronously, matching the form's expected signature
  const handleSave = async (data: any) => {
    router.refresh(); // Syncs the new data down to server components
    onClose(); // Closes the edit dialog modal
  };

  return (
    <SubscriptionForm
      mode="edit"
      subscription={subscription}
      goals={goals}
      onClose={onClose}
      onSave={handleSave} // Fixes: Property 'onSave' is missing
    />
  );
}

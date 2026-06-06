// components/subscriptions/EditSubscriptionDialog.tsx
"use client";

import { Subscription, Goal } from "@/types";
import { SubscriptionForm } from "./SubscriptionForm";

interface Props {
  subscription: Subscription;
  goals: Goal[];
  onClose: () => void;
}

export function EditSubscriptionDialog({ subscription, goals, onClose }: Props) {
  return <SubscriptionForm mode="edit" subscription={subscription} goals={goals} onClose={onClose} />;
}

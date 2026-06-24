// app/goals/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoalsList } from "@/components/goals/GoalsList";
import { GoalAlignmentPanel } from "@/components/goals/GoalAlignmentPanel";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [goals, subscriptions] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      include: { subscriptions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { userId, status: "ACTIVE" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Goals</h1>
        <p className="text-muted mt-1">Align your subscriptions with what actually matters to you</p>
      </div>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <GoalsList/>
        </div>
        <div className="col-span-3">
          <GoalAlignmentPanel/>
        </div>
      </div>
    </div>
  );
}

// app/scanning/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsageSurvey } from "@/components/scanning/UsageSurvey";
import { RarelyUsedList } from "@/components/scanning/RarelyUsedList";

export default async function ScanningPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [subscriptions, survey, rarelyUsed] = await Promise.all([
    prisma.subscription.findMany({ where: { userId, status: "ACTIVE" } }),
    prisma.survey.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: { entries: true },
    }),
    prisma.subscription.findMany({
      where: { userId, status: "ACTIVE", usageLevel: { in: ["RARELY", "NEVER"] } },
    }),
  ]);

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Usage Scanner</h1>
        <p className="text-muted mt-1">Find subscriptions you rarely use and save money</p>
      </div>

      {rarelyUsed.length > 0 && (
        <RarelyUsedList subscriptions={rarelyUsed as any} />
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-ink">
            Monthly Survey — {MONTH_NAMES[month - 1]} {year}
          </h2>
          {survey && (
            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-md">✓ Completed</span>
          )}
        </div>
        <UsageSurvey
          subscriptions={subscriptions as any}
          existingSurvey={survey as any}
        />
      </div>
    </div>
  );
}

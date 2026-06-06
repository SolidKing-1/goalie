// app/api/cron/daily/route.ts
// Vercel Cron: schedule = "0 8 * * *" (8am UTC daily)
import { NextResponse } from "next/server";
import { scheduleRenewalReminders, checkBudgetAlerts } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Protect with a secret header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, budget] = await Promise.all([
    scheduleRenewalReminders(),
    checkBudgetAlerts(),
  ]);

  return NextResponse.json({
    success: true,
    reminders,
    budgetAlertsChecked: true,
  });
}

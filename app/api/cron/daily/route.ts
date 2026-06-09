// app/api/cron/daily/route.ts
// Vercel Cron: schedule = "0 8 * * *" (8am UTC daily)
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { scheduleRenewalReminders, checkBudgetAlerts } from "@/lib/notifications";

export const runtime = "nodejs";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: Request) {
  try {
    // Secure authorization check using timingSafeEqual
    const authHeader = req.headers.get("authorization");
    const expected = process.env.CRON_SECRET;
    
    if (!expected || !authHeader || !safeCompare(authHeader, `Bearer ${expected}`)) {
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
  } catch (error) {
    console.error("GET /api/cron/daily failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
/**
 * Tests for app/api/cron/daily/route.ts
 */

jest.mock("@/lib/notifications", () => ({
  scheduleRenewalReminders: jest.fn(),
  checkBudgetAlerts: jest.fn(),
}));

import { scheduleRenewalReminders, checkBudgetAlerts } from "@/lib/notifications";
import { GET } from "@/app/api/cron/daily/route";

const mockReminders = scheduleRenewalReminders as jest.MockedFunction<typeof scheduleRenewalReminders>;
const mockBudget = checkBudgetAlerts as jest.MockedFunction<typeof checkBudgetAlerts>;

describe("GET /api/cron/daily", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "test-secret" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 without valid authorization header", async () => {
    const req = new Request("http://localhost/api/cron/daily", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 without authorization header", async () => {
    const req = new Request("http://localhost/api/cron/daily");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("runs reminders and budget checks with valid secret", async () => {
    mockReminders.mockResolvedValue({ scheduled: 3 });
    mockBudget.mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/cron/daily", {
      headers: { authorization: "Bearer test-secret" },
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reminders).toEqual({ scheduled: 3 });
    expect(data.budgetAlertsChecked).toBe(true);
    expect(mockReminders).toHaveBeenCalledTimes(1);
    expect(mockBudget).toHaveBeenCalledTimes(1);
  });
});

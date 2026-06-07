/**
 * Tests for lib/notifications.ts
 *
 * Mocks Prisma client and utils to test scheduling logic in isolation.
 */

// Mock prisma before importing the module under test
jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findMany: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    budget: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { scheduleRenewalReminders, checkBudgetAlerts } from "@/lib/notifications";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("scheduleRenewalReminders", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-01T12:00:00Z"));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates reminders for subscriptions renewing within notifyDaysBefore window", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Netflix",
        cost: 15.99,
        renewalDate: new Date("2025-06-03T00:00:00Z"), // 2 days away
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user1",
          subscriptionId: "sub1",
          type: "RENEWAL_REMINDER",
        }),
      }),
    );
  });

  it("does not create reminders outside the notifyDaysBefore window", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Netflix",
        cost: 15.99,
        renewalDate: new Date("2025-06-20T00:00:00Z"), // 19 days away
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(0);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("does not create duplicate reminders", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Netflix",
        cost: 15.99,
        renewalDate: new Date("2025-06-02T00:00:00Z"),
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);
    // Existing notification found
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue({
      id: "existing",
    });

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(0);
    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("handles empty subscription list", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([]);

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(0);
  });

  it("does not create reminders for past renewal dates", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Netflix",
        cost: 15.99,
        renewalDate: new Date("2025-05-25T00:00:00Z"), // past
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(0);
  });

  it("creates reminder for subscription renewing today", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Spotify",
        cost: 9.99,
        renewalDate: new Date("2025-06-01T12:00:00Z"), // today
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: expect.stringContaining("today"),
        }),
      }),
    );
  });

  it("handles multiple subscriptions, some in window some not", async () => {
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      {
        id: "sub1",
        userId: "user1",
        name: "Netflix",
        cost: 15.99,
        renewalDate: new Date("2025-06-02T00:00:00Z"), // 1 day, in window
        notifyDaysBefore: 3,
        status: "ACTIVE",
        user: { id: "user1" },
      },
      {
        id: "sub2",
        userId: "user1",
        name: "Gym",
        cost: 50,
        renewalDate: new Date("2025-07-01T00:00:00Z"), // 30 days, out of window
        notifyDaysBefore: 7,
        status: "ACTIVE",
        user: { id: "user1" },
      },
    ]);
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    const result = await scheduleRenewalReminders();

    expect(result.scheduled).toBe(1);
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
  });
});

describe("checkBudgetAlerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates BUDGET_EXCEEDED notification when spending exceeds limit", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "user1",
        monthlyLimit: 50,
        alertAt: 0.9,
        user: {
          subscriptions: [
            { cost: 60, billingCycle: "MONTHLY", status: "ACTIVE" },
          ],
        },
      },
    ]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    await checkBudgetAlerts();

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "BUDGET_EXCEEDED",
          title: "Budget Exceeded!",
        }),
      }),
    );
  });

  it("creates BUDGET_WARNING when at alertAt threshold", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "user1",
        monthlyLimit: 100,
        alertAt: 0.9,
        user: {
          subscriptions: [
            { cost: 95, billingCycle: "MONTHLY", status: "ACTIVE" },
          ],
        },
      },
    ]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    await checkBudgetAlerts();

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "BUDGET_WARNING",
          title: "Budget Warning",
        }),
      }),
    );
  });

  it("does not create alerts when spending is below threshold", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "user1",
        monthlyLimit: 100,
        alertAt: 0.9,
        user: {
          subscriptions: [
            { cost: 20, billingCycle: "MONTHLY", status: "ACTIVE" },
          ],
        },
      },
    ]);

    await checkBudgetAlerts();

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("handles empty budget list", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([]);

    await checkBudgetAlerts();

    expect(mockPrisma.notification.create).not.toHaveBeenCalled();
  });

  it("correctly converts yearly subscription costs to monthly", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "user1",
        monthlyLimit: 50,
        alertAt: 0.9,
        user: {
          subscriptions: [
            { cost: 1200, billingCycle: "YEARLY", status: "ACTIVE" }, // $100/mo
          ],
        },
      },
    ]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    await checkBudgetAlerts();

    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "BUDGET_EXCEEDED",
        }),
      }),
    );
  });

  it("sums multiple subscriptions correctly", async () => {
    (mockPrisma.budget.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "user1",
        monthlyLimit: 100,
        alertAt: 0.9,
        user: {
          subscriptions: [
            { cost: 30, billingCycle: "MONTHLY", status: "ACTIVE" },
            { cost: 30, billingCycle: "MONTHLY", status: "ACTIVE" },
            { cost: 35, billingCycle: "MONTHLY", status: "ACTIVE" },
          ],
        },
      },
    ]);
    (mockPrisma.notification.create as jest.Mock).mockResolvedValue({});

    await checkBudgetAlerts();

    // 95/100 = 0.95 >= 0.9 alertAt → warning
    expect(mockPrisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "BUDGET_WARNING",
        }),
      }),
    );
  });
});

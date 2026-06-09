/**
 * Tests for app/api/budget/route.ts
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    budget: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/budget/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GET /api/budget", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns budget data with calculated totalMonthly", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue({
      monthlyLimit: 100,
      currency: "USD",
      alertAt: 0.9,
    });
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      { cost: 10, billingCycle: "MONTHLY" },
      { cost: 120, billingCycle: "YEARLY" }, // $10/mo
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.budget).toBeDefined();
    expect(data.totalMonthly).toBe(20); // 10 + 10
    expect(data.subscriptions).toHaveLength(2);
  });

  it("returns null budget when none set", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.budget.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(data.budget).toBeNull();
    expect(data.totalMonthly).toBe(0);
  });
});

describe("PUT /api/budget", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit: 100 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit: -10 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("upserts budget with valid data", async () => {
    const budgetData = { monthlyLimit: 200, currency: "USD", alertAt: 0.8 };
    const created = { id: "b1", userId: "user1", ...budgetData };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.budget.upsert as jest.Mock).mockResolvedValue(created);

    const req = new NextRequest("http://localhost/api/budget", {
      method: "PUT",
      body: JSON.stringify(budgetData),
    });
    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.monthlyLimit).toBe(200);
  });

  it("rejects alertAt above 1", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit: 100, alertAt: 1.5 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("rejects alertAt below 0.5", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit: 100, alertAt: 0.1 }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});

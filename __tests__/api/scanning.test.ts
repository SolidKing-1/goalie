/**
 * Tests for app/api/scanning/route.ts
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    survey: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    subscription: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/scanning/route";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GET /api/scanning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => jest.useRealTimers());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns survey status and rarely-used subscriptions", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.survey.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      { id: "s1", name: "Unused App", usageLevel: "NEVER" },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.month).toBe(6);
    expect(data.year).toBe(2025);
    expect(data.rarelyUsed).toHaveLength(1);
  });
});

describe("POST /api/scanning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => jest.useRealTimers());

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/scanning", {
      method: "POST",
      body: JSON.stringify({ entries: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid survey data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/scanning", {
      method: "POST",
      body: JSON.stringify({ entries: [{ subscriptionId: "s1" }] }), // missing usageLevel
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates survey and updates usage levels", async () => {
    const entries = [
      { subscriptionId: "s1", usageLevel: "DAILY" },
      { subscriptionId: "s2", usageLevel: "NEVER" },
    ];
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.survey.upsert as jest.Mock).mockResolvedValue({
      id: "survey1",
      entries,
    });
    (mockPrisma.subscription.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue([
      { id: "s2", name: "Unused App", cost: 10, usageLevel: "NEVER" },
    ]);
    (mockPrisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

    const req = new NextRequest("http://localhost/api/scanning", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockPrisma.subscription.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.notification.createMany).toHaveBeenCalled();
  });

  it("does not create rarely-used notifications when all subs are used", async () => {
    const entries = [
      { subscriptionId: "s1", usageLevel: "DAILY" },
      { subscriptionId: "s2", usageLevel: "WEEKLY" },
    ];
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.survey.upsert as jest.Mock).mockResolvedValue({
      id: "survey1",
      entries,
    });
    (mockPrisma.subscription.update as jest.Mock).mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/scanning", {
      method: "POST",
      body: JSON.stringify({ entries }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled();
  });
});

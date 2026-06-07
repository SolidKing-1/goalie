/**
 * Tests for app/api/subscriptions/ route handlers.
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GET /api/subscriptions", () => {
  let handler: typeof import("@/app/api/subscriptions/route").GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/subscriptions/route");
    handler = mod.GET;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);

    const res = await handler();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns subscriptions for authenticated user", async () => {
    const mockSubs = [
      { id: "s1", name: "Netflix", userId: "user1", cost: 15.99 },
    ];
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.findMany as jest.Mock).mockResolvedValue(mockSubs);

    const res = await handler();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockSubs);
    expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      include: { goal: true },
      orderBy: { renewalDate: "asc" },
    });
  });
});

describe("POST /api/subscriptions", () => {
  let handler: typeof import("@/app/api/subscriptions/route").POST;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/subscriptions/route");
    handler = mod.POST;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("creates a subscription with valid data", async () => {
    const validBody = {
      name: "Spotify",
      cost: 9.99,
      billingCycle: "MONTHLY",
      renewalDate: "2025-07-01T00:00:00.000Z",
      category: "STREAMING",
    };
    const created = { id: "new-id", ...validBody, userId: "user1" };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.create as jest.Mock).mockResolvedValue(created);

    const req = new NextRequest("http://localhost/api/subscriptions", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const res = await handler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe("Spotify");
  });

  it("rejects negative cost", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        cost: -5,
        billingCycle: "MONTHLY",
        renewalDate: "2025-07-01T00:00:00.000Z",
        category: "OTHER",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("rejects invalid billing cycle", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        name: "Test",
        cost: 10,
        billingCycle: "BIWEEKLY",
        renewalDate: "2025-07-01T00:00:00.000Z",
        category: "OTHER",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/subscriptions/[id]", () => {
  let handler: typeof import("@/app/api/subscriptions/[id]/route").PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/subscriptions/[id]/route");
    handler = mod.PATCH;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });

    const res = await handler(req, { params: { id: "s1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when subscription not owned by user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });

    const res = await handler(req, { params: { id: "s1" } });
    expect(res.status).toBe(404);
  });

  it("updates subscription with valid data", async () => {
    const existing = { id: "s1", userId: "user1", name: "Old Name" };
    const updated = { ...existing, name: "New Name" };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue(existing);
    (mockPrisma.subscription.update as jest.Mock).mockResolvedValue(updated);

    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });

    const res = await handler(req, { params: { id: "s1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe("New Name");
  });
});

describe("DELETE /api/subscriptions/[id]", () => {
  let handler: typeof import("@/app/api/subscriptions/[id]/route").DELETE;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/subscriptions/[id]/route");
    handler = mod.DELETE;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "DELETE",
    });

    const res = await handler(req, { params: { id: "s1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when subscription not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "DELETE",
    });

    const res = await handler(req, { params: { id: "s1" } });
    expect(res.status).toBe(404);
  });

  it("deletes subscription and returns 204", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue({ id: "s1" });
    (mockPrisma.subscription.delete as jest.Mock).mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/subscriptions/s1", {
      method: "DELETE",
    });

    const res = await handler(req, { params: { id: "s1" } });
    expect(res.status).toBe(204);
  });
});

/**
 * Tests for app/api/goals/ route handlers.
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/llm", () => ({
  analyzeGoalAlignment: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GET /api/goals", () => {
  let handler: typeof import("@/app/api/goals/route").GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/goals/route");
    handler = mod.GET;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await handler();
    expect(res.status).toBe(401);
  });

  it("returns goals for authenticated user", async () => {
    const goals = [
      { id: "g1", title: "Get Fit", userId: "user1", category: "HEALTH" },
    ];
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.findMany as jest.Mock).mockResolvedValue(goals);

    const res = await handler();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(goals);
  });
});

describe("POST /api/goals", () => {
  let handler: typeof import("@/app/api/goals/route").POST;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/goals/route");
    handler = mod.POST;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/goals", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("creates goal with valid data", async () => {
    const goalData = { title: "Learn Rust", category: "EDUCATION" };
    const created = { id: "g-new", userId: "user1", ...goalData, status: "ACTIVE" };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.create as jest.Mock).mockResolvedValue(created);

    const req = new NextRequest("http://localhost/api/goals", {
      method: "POST",
      body: JSON.stringify(goalData),
    });
    const res = await handler(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.title).toBe("Learn Rust");
  });

  it("returns 400 for missing title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/goals", {
      method: "POST",
      body: JSON.stringify({ category: "HEALTH" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid category", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    const req = new NextRequest("http://localhost/api/goals", {
      method: "POST",
      body: JSON.stringify({ title: "Test", category: "INVALID" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/goals/[id]", () => {
  let handler: typeof import("@/app/api/goals/[id]/route").DELETE;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/goals/[id]/route");
    handler = mod.DELETE;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "DELETE",
    });
    const res = await handler(req, { params: { id: "g1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when goal not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "DELETE",
    });
    const res = await handler(req, { params: { id: "g1" } });
    expect(res.status).toBe(404);
  });

  it("deletes goal and returns 204", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.findFirst as jest.Mock).mockResolvedValue({ id: "g1", userId: "user1" });
    (mockPrisma.goal.delete as jest.Mock).mockResolvedValue({});

    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "DELETE",
    });
    const res = await handler(req, { params: { id: "g1" } });
    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/goals/[id]", () => {
  let handler: typeof import("@/app/api/goals/[id]/route").PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/goals/[id]/route");
    handler = mod.PATCH;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await handler(req, { params: { id: "g1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when goal not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await handler(req, { params: { id: "g1" } });
    expect(res.status).toBe(404);
  });

  it("updates goal with valid data", async () => {
    const existing = { id: "g1", userId: "user1", title: "Old" };
    const updated = { ...existing, title: "New Title" };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.goal.findFirst as jest.Mock).mockResolvedValue(existing);
    (mockPrisma.goal.update as jest.Mock).mockResolvedValue(updated);

    const req = new NextRequest("http://localhost/api/goals/g1", {
      method: "PATCH",
      body: JSON.stringify({ title: "New Title" }),
    });
    const res = await handler(req, { params: { id: "g1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe("New Title");
  });
});

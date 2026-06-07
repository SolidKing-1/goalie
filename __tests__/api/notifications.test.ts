/**
 * Tests for app/api/notifications/ route handlers.
 */

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("GET /api/notifications", () => {
  let handler: typeof import("@/app/api/notifications/route").GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/notifications/route");
    handler = mod.GET;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const res = await handler();
    expect(res.status).toBe(401);
  });

  it("returns notifications for authenticated user", async () => {
    const notifications = [
      { id: "n1", title: "Netflix renewing", type: "RENEWAL_REMINDER" },
    ];
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

    const res = await handler();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(notifications);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user1" },
        take: 50,
      }),
    );
  });
});

describe("PATCH /api/notifications (mark all read)", () => {
  let handler: typeof import("@/app/api/notifications/route").PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/notifications/route");
    handler = mod.PATCH;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("marks specific notifications as read when ids provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids: ["n1", "n2"] }),
    });
    const res = await handler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["n1", "n2"] }, userId: "user1" },
      data: { isRead: true },
    });
  });

  it("marks all notifications as read when no ids provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await handler(req);

    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      data: { isRead: true },
    });
  });
});

describe("PATCH /api/notifications/[id]", () => {
  let handler: typeof import("@/app/api/notifications/[id]/route").PATCH;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import("@/app/api/notifications/[id]/route");
    handler = mod.PATCH;
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null as any);
    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    const res = await handler(req, { params: { id: "n1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when notification not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    const res = await handler(req, { params: { id: "n1" } });
    expect(res.status).toBe(404);
  });

  it("updates notification successfully", async () => {
    const existing = { id: "n1", userId: "user1", isRead: false };
    const updated = { ...existing, isRead: true };

    mockAuth.mockResolvedValue({ user: { id: "user1" } } as any);
    (mockPrisma.notification.findFirst as jest.Mock).mockResolvedValue(existing);
    (mockPrisma.notification.update as jest.Mock).mockResolvedValue(updated);

    const req = new NextRequest("http://localhost/api/notifications/n1", {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    const res = await handler(req, { params: { id: "n1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isRead).toBe(true);
  });
});

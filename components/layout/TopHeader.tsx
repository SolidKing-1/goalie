// components/layout/TopHeader.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NotificationsBell } from "./NotificationsBell";

export async function TopHeader() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rawNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Transform 'null' database fields into 'undefined' to satisfy the frontend component types
  const notifications = rawNotifications.map((n) => ({
    ...n,
    subscriptionId: n.subscriptionId ?? undefined,
    scheduledFor: n.scheduledFor ?? undefined, // Did the same for these just in case they are also optional types!
    sentAt: n.sentAt ?? undefined,
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-surface border-b border-border z-30">
      <div className="h-full max-w-6xl mx-auto px-8 flex items-center justify-end">
        <NotificationsBell
          notifications={notifications}
          unreadCount={unreadCount}
        />
      </div>
    </header>
  );
}

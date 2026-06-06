// app/settings/page.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user!.id! },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-surface">
        <div className="max-w-2xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Settings</h1>
            <p className="text-muted mt-1">Manage your account and preferences</p>
          </div>
          <SettingsForm user={user as any} />
        </div>
      </main>
    </div>
  );
}

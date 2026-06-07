// app/dashboard/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { OnboardingGuard } from "@/components/layout/OnboardingGuard";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/auth/login");

  // Check if user has completed onboarding
  await OnboardingGuard();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <TopHeader />
      <main className="flex-1 ml-64 mt-16 min-h-screen bg-surface">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

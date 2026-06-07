import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect logged-in users away from auth pages
  if (session?.user) {
    redirect("/dashboard");
  }

  return <div className="min-h-screen bg-surface">{children}</div>;
}

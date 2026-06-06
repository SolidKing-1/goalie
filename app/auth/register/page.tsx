// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Crosshair, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      // Auto sign-in after registration
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-surface" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-ink">Project Goalie</p>
            <p className="text-xs text-muted">Subscription Manager</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-ink mb-1">Create your account</h1>
        <p className="text-muted text-sm mb-6">Free forever for up to 10 subscriptions</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Name", field: "name", type: "text", placeholder: "Jane Doe" },
            { label: "Email", field: "email", type: "email", placeholder: "you@example.com" },
            { label: "Password", field: "password", type: "password", placeholder: "Min 8 characters" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-medium text-muted">{label}</label>
              <input
                type={type}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                required
                minLength={field === "password" ? 8 : undefined}
                className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-ink outline-none focus:border-accent transition-colors"
              />
            </div>
          ))}

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-surface py-3 rounded-xl text-sm font-semibold hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-xs text-muted">or</span>
          </div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="mt-4 w-full bg-surface-2 border border-border text-ink py-3 rounded-xl text-sm font-medium hover:border-ink/30 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-muted mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-accent hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}

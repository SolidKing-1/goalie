// app/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"];
const BUDGET_PRESETS = [
  { label: "Minimal", value: 20 },
  { label: "Moderate", value: 50 },
  { label: "Comfortable", value: 100 },
  { label: "Premium", value: 200 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState(100);
  const [customBudget, setCustomBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalBudget = customBudget ? parseFloat(customBudget) : budget;

  async function complete() {
    if (finalBudget <= 0) {
      setError("Budget must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          monthlyBudget: finalBudget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete onboarding");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-ink mb-2">
            Welcome to Goalie
          </h1>
          <p className="text-muted">
            Let's set up your subscription management in 30 seconds
          </p>
        </div>

        <div className="card space-y-8">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-accent" : "bg-border"}`}
            />
            <div
              className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-accent" : "bg-border"}`}
            />
          </div>

          {/* Step 1: Currency Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-ink mb-1">
                  What's your currency?
                </h2>
                <p className="text-sm text-muted">
                  We'll use this for all your subscriptions
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CURRENCIES.map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                      currency === curr
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted hover:border-ink/30"
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-accent text-surface py-3 rounded-lg font-medium hover:bg-accent-dim transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Budget Setting */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-ink mb-1">
                  Monthly budget limit
                </h2>
                <p className="text-sm text-muted">
                  How much do you want to spend on subscriptions?
                </p>
              </div>

              {/* Quick presets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted">
                  Quick select:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        setBudget(preset.value);
                        setCustomBudget("");
                      }}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                        !customBudget && budget === preset.value
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted hover:border-ink/30"
                      }`}
                    >
                      {currency} {preset.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="space-y-2">
                <label
                  htmlFor="custom-budget"
                  className="text-xs font-medium text-muted"
                >
                  Or enter custom amount:
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2 bg-surface-3 border border-border rounded-lg text-muted">
                    {currency}
                  </span>
                  <input
                    id="custom-budget"
                    type="number"
                    placeholder="0.00"
                    value={customBudget}
                    onChange={(e) => {
                      setCustomBudget(e.target.value);
                      if (e.target.value) setBudget(0);
                    }}
                    className="flex-1 px-3 py-2 bg-surface-3 border border-border rounded-lg text-ink outline-none focus:border-accent transition-colors"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 rounded-lg border border-border text-muted hover:text-ink transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={complete}
                  disabled={loading}
                  className="flex-1 bg-accent text-surface py-3 rounded-lg font-medium hover:bg-accent-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Setting up…" : "Complete"}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          You can change these settings anytime in Settings
        </p>
      </div>
    </div>
  );
}

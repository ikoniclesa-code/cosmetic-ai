"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/config/plans";

export default function PricingPage() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubscribe(planId: string) {
    setLoadingPlan(planId);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: planId, billingCycle: cycle }),
      });

      const data = await res.json();

      if (!data.success) {
        if (res.status === 401) {
          window.location.href = "/login?redirectTo=/pricing";
          return;
        }
        setError(data.error || "Greška pri kreiranju sesije.");
      } else if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setError("Mrežna greška. Pokušajte ponovo.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Cosmetic AI</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Prijava
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Izaberite plan
          </h2>
          <p className="text-gray-500 mb-6">
            Počnite da kreirate AI sadržaj za vaš biznis
          </p>

          <div className="inline-flex items-center rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                cycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mesečno
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                cycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Godišnje{" "}
              <span className="text-green-600 text-xs font-semibold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const price =
              cycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isPopular = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border bg-white p-6 flex flex-col ${
                  isPopular
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Najpopularniji
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900">
                  {plan.name}
                </h3>

                <div className="mt-4 mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">
                    /{cycle === "monthly" ? "mesec" : "godišnje"}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  {plan.monthlyCredits.toLocaleString()} kredita mesečno
                </p>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="text-green-500 mt-0.5">&#10003;</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {loadingPlan === plan.id
                    ? "Preusmeravanje..."
                    : "Pretplati se"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Krediti se resetuju mesečno. Neiskorišćeni krediti se ne prenose.
          Možete otkazati pretplatu u bilo kom trenutku.
        </p>
      </div>
    </main>
  );
}

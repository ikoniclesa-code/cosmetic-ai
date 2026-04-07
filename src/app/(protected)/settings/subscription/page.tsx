"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SubscriptionData {
  plan_type: string;
  billing_cycle: string;
  status: string;
  monthly_credits: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  pro_plus: "Pro+",
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/subscription");
        const data = await res.json();
        if (data.success) {
          setSubscription(data.data.subscription);
        }
      } catch {
        setError("Greška pri učitavanju podataka o pretplati.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error || "Greška pri otvaranju portala.");
      }
    } catch {
      setError("Mrežna greška.");
    } finally {
      setPortalLoading(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("sr-Latn-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getStatusBadge(sub: SubscriptionData) {
    if (sub.cancel_at_period_end && sub.status === "active") {
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end)
        : null;
      const isStillValid = periodEnd ? new Date() < periodEnd : false;

      if (isStillValid) {
        return {
          label: `Otkazana — važi do ${formatDate(sub.current_period_end)}`,
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
      }
      return {
        label: "Istekla",
        color: "bg-red-50 text-red-700 border-red-200",
      };
    }

    switch (sub.status) {
      case "active":
        return {
          label: "Aktivna",
          color: "bg-green-50 text-green-700 border-green-200",
        };
      case "past_due":
        return {
          label: "Plaćanje neuspelo",
          color: "bg-red-50 text-red-700 border-red-200",
        };
      case "canceled":
        return {
          label: "Otkazana",
          color: "bg-gray-50 text-gray-700 border-gray-200",
        };
      default:
        return {
          label: "Nekompletna",
          color: "bg-gray-50 text-gray-500 border-gray-200",
        };
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/settings"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            &larr; Podešavanja
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Pretplata</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !subscription && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Nemate aktivnu pretplatu
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Izaberite plan da biste dobili kredite i počeli da kreirate
              sadržaj.
            </p>
            <Link
              href="/pricing"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Pogledajte planove
            </Link>
          </div>
        )}

        {!loading && subscription && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {PLAN_NAMES[subscription.plan_type] || subscription.plan_type}{" "}
                    plan
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {subscription.billing_cycle === "monthly"
                      ? "Mesečna pretplata"
                      : "Godišnja pretplata"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(subscription).color}`}
                >
                  {getStatusBadge(subscription).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-xs text-gray-500">Mesečni krediti</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {subscription.monthly_credits.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ciklus plaćanja</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {subscription.billing_cycle === "monthly"
                      ? "Mesečno"
                      : "Godišnje"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Početak perioda</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(subscription.current_period_start)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kraj perioda</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              </div>
            </div>

            {subscription.cancel_at_period_end &&
              subscription.status === "active" && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    Vaša pretplata je otkazana i neće se obnoviti. Možete
                    koristiti aplikaciju do{" "}
                    <strong>
                      {formatDate(subscription.current_period_end)}
                    </strong>
                    . Nakon toga, nećete moći da generirate sadržaj.
                  </p>
                </div>
              )}

            {subscription.status === "past_due" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  Poslednje plaćanje nije uspelo. Ažurirajte način plaćanja da
                  biste nastavili da koristite aplikaciju.
                </p>
              </div>
            )}

            {subscription.status === "canceled" && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-700">
                  Vaša pretplata je istekla. Izaberite novi plan da nastavite sa
                  korišćenjem.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Pogledajte planove &rarr;
                </Link>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {portalLoading
                  ? "Otvaranje..."
                  : "Upravljaj pretplatom (Stripe)"}
              </button>

              {(subscription.status === "canceled" ||
                (subscription.cancel_at_period_end &&
                  subscription.status === "active")) && (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Izaberi novi plan
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

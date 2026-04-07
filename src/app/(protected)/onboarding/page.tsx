"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SOCIAL_NETWORKS = ["Facebook", "Instagram", "TikTok", "X (bivsi Twitter)"];

type Industry = "cosmetics" | "home_chemistry" | "both";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [industry, setIndustry] = useState<Industry | "">("");
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [communicationTone, setCommunicationTone] = useState("");
  const [socialNetworks, setSocialNetworks] = useState<string[]>([]);

  function toggleNetwork(network: string) {
    setSocialNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  }

  async function handleFinish() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Niste prijavljeni.");
        return;
      }

      await supabase.from("businesses").insert({
        user_id: user.id,
        name: brandName || null,
        industry: (industry || null) as Industry | null,
        description: description || null,
        target_audience: targetAudience || null,
        communication_tone: communicationTone || null,
        social_networks: socialNetworks.length > 0 ? socialNetworks : null,
      });

      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Došlo je do greške. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cosmetic AI</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Korak {step} od 3</p>
          <div className="mt-4 flex gap-2 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-24 rounded-full ${
                  s <= step ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f162d]">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">O vasem biznisu</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">Recite nam nesto o vasoj kompaniji</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Industrija (mozes izabrati i obe)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  setIndustry((prev) =>
                    prev === "cosmetics" ? "" : prev === "home_chemistry" ? "both" : "cosmetics"
                  )
                }
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  industry === "cosmetics" || industry === "both"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">Kozmetika</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Kreme, maske, šminke i sl.
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setIndustry((prev) =>
                    prev === "home_chemistry" ? "" : prev === "cosmetics" ? "both" : "home_chemistry"
                  )
                }
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  industry === "home_chemistry" || industry === "both"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">Kućna hemija</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deterdženti, odmašćivači i sl.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIndustry("both")}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  industry === "both"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">Obe opcije</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Kozmetika + Kućna hemija</div>
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Preskoči
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!industry}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Dalje
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f162d]">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Vas brend</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">Pomozite nam da razumemo vas stil</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ime brenda"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <textarea
                placeholder="Opis brenda"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Ciljna grupa (npr. žene 25-45)"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Ton komunikacije (npr. profesionalan, prijateljski)"
                value={communicationTone}
                onChange={(e) => setCommunicationTone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Nazad
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Preskoči
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Dalje
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0f162d]">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Skoro gotovo!</h2>
            <p className="text-base text-gray-500 dark:text-gray-400">Poslednji korak pre početka</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Na kojim mrežama ste prisutni? (opciono)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Izbor mreza ima svrhu: AI prilagodjava duzinu, stil i format objave svakoj mrezi.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SOCIAL_NETWORKS.map((network) => (
                <button
                  key={network}
                  type="button"
                  onClick={() => toggleNetwork(network)}
                  className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                    socialNetworks.includes(network)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {network}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Nazad
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Čuvanje..." : "Završi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

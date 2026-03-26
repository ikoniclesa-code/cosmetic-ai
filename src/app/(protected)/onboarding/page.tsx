"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SOCIAL_NETWORKS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "Twitter/X",
  "YouTube",
  "Pinterest",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [industry, setIndustry] = useState<string>("");
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
        industry: industry as "cosmetics" | "home_chemistry" | null,
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Hajde da postavimo vaš profil
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Korak {step} od 3 — sva polja su opciona
          </p>
          <div className="flex gap-2 justify-center mt-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full ${
                  s <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              U kom sektoru poslujete?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIndustry("cosmetics")}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  industry === "cosmetics"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">Kozmetika</div>
                <div className="text-xs text-gray-500 mt-1">
                  Kreme, maske, šminke i sl.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIndustry("home_chemistry")}
                className={`rounded-lg border-2 p-4 text-left transition-colors ${
                  industry === "home_chemistry"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-gray-900">Kućna hemija</div>
                <div className="text-xs text-gray-500 mt-1">
                  Deterdženti, odmašćivači i sl.
                </div>
              </button>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              Recite nam nešto o vašem brendu (opciono)
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Ime brenda"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <textarea
                placeholder="Opis brenda"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <input
                type="text"
                placeholder="Ciljna grupa (npr. žene 25-45)"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Ton komunikacije (npr. profesionalan, prijateljski)"
                value={communicationTone}
                onChange={(e) => setCommunicationTone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Nazad
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              Na kojim mrežama ste prisutni? (opciono)
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_NETWORKS.map((network) => (
                <button
                  key={network}
                  type="button"
                  onClick={() => toggleNetwork(network)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    socialNetworks.includes(network)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {network}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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

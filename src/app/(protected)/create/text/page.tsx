"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MIN_PROMPT_LENGTH, MAX_PROMPT_LENGTH } from "@/lib/validation";

function getErrorMessage(status: number, serverError?: string): string {
  switch (status) {
    case 401:
      return "Niste prijavljeni. Prijavite se da biste nastavili.";
    case 402:
      return "Nemate dovoljno kredita.";
    case 403:
      return serverError?.toLowerCase().includes("subscription")
        ? "Nemate aktivnu pretplatu. Izaberite plan da biste počeli."
        : "Nemate pristup.";
    case 429:
      return "Previše zahteva. Sačekajte malo pa pokušajte ponovo.";
    case 502:
      return "AI servis trenutno nije dostupan. Krediti nisu oduzeti. Pokušajte ponovo.";
    case 504:
      return "Generisanje je trajalo predugo. Pokušajte ponovo.";
    default:
      return serverError || "Došlo je do greške. Pokušajte ponovo.";
  }
}

export default function CreateTextPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);

  const loadCredits = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (data) setCredits(data.credits);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const promptLength = prompt.trim().length;
  const isPromptValid =
    promptLength >= MIN_PROMPT_LENGTH && promptLength <= MAX_PROMPT_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !isPromptValid) return;

    setLoading(true);
    setError("");
    setErrorStatus(0);
    setResult("");

    try {
      const body: Record<string, string> = { prompt };
      if (imageUrl.trim()) body.imageUrl = imageUrl.trim();

      const res = await fetch("/api/generate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorStatus(res.status);
        setError(getErrorMessage(res.status, data.error));
      } else {
        setResult(data.data.result_text);
        setCredits(data.data.credits_remaining);
      }
    } catch {
      setError("Mrežna greška. Proverite internet konekciju.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              &larr; Dashboard
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Kreiraj tekst</h1>
          </div>
          {credits !== null && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {credits} kredita
            </span>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700"
              >
                Prompt
              </label>
              <span
                className={`text-xs ${
                  promptLength > MAX_PROMPT_LENGTH
                    ? "text-red-500"
                    : promptLength >= MIN_PROMPT_LENGTH
                      ? "text-green-600"
                      : "text-gray-400"
                }`}
              >
                {promptLength}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Npr: Napiši Instagram post za novu kolekciju anti-aging krema. Ton: profesionalan ali pristupačan."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              disabled={loading}
              maxLength={MAX_PROMPT_LENGTH + 100}
            />
            {promptLength > 0 && promptLength < MIN_PROMPT_LENGTH && (
              <p className="text-xs text-amber-600 mt-1">
                Minimalno {MIN_PROMPT_LENGTH} karaktera
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              URL slike{" "}
              <span className="text-gray-400">
                (opciono — AI ce opisati sliku)
              </span>
            </label>
            <input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/product.jpg"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isPromptValid}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generisem tekst..." : "Generisi tekst (1 kredit)"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            {(errorStatus === 402 || errorStatus === 403) && (
              <Link
                href="/pricing"
                className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Pogledajte planove &rarr;
              </Link>
            )}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Generisani tekst
              </h3>
              <button
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Kopiraj
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {result}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

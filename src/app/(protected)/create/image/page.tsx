"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CreateImagePage() {
  const [prompt, setPrompt] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  async function loadCredits() {
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
  }

  useState(() => {
    loadCredits();
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || prompt.trim().length < 3) return;

    setLoading(true);
    setError("");
    setResultUrl("");

    if (submitRef.current) submitRef.current.disabled = true;

    try {
      const res = await fetch("/api/generate/image-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Greška pri generisanju slike.");
      } else {
        setResultUrl(data.data.result_image_url);
        setCredits(data.data.credits_remaining);
      }
    } catch {
      setError("Mrežna greška. Pokušajte ponovo.");
    } finally {
      setLoading(false);
      if (submitRef.current) submitRef.current.disabled = false;
    }
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
            <h1 className="text-lg font-bold text-gray-900">Kreiraj sliku</h1>
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
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Opis slike{" "}
              <span className="text-gray-400">(min. 3 karaktera)</span>
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Npr: Elegantna anti-aging krema u zlatnoj tegli na mramornoj površini, meko osvetljenje, minimalistički stil."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              disabled={loading}
            />
          </div>

          <button
            ref={submitRef}
            type="submit"
            disabled={loading || prompt.trim().length < 3}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Generišem sliku... (ovo može potrajati do 60s)"
              : "Generiši sliku (14 kredita)"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              AI generiše sliku, molimo sačekajte...
            </p>
          </div>
        )}

        {resultUrl && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Generisana slika
            </h3>
            <img
              src={resultUrl}
              alt="Generisana slika"
              className="w-full rounded-lg"
            />
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-blue-600 hover:text-blue-800"
            >
              Otvori u novom tabu
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

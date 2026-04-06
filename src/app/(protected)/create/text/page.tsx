"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CreateTextPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState("");
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
    setResult("");

    if (submitRef.current) submitRef.current.disabled = true;

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
        setError(data.error || "Greška pri generisanju teksta.");
      } else {
        setResult(data.data.result_text);
        setCredits(data.data.credits_remaining);
      }
    } catch {
      setError("Mrežna greška. Pokušajte ponovo.");
    } finally {
      setLoading(false);
      if (submitRef.current) submitRef.current.disabled = false;
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
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Prompt <span className="text-gray-400">(min. 3 karaktera)</span>
            </label>
            <textarea
              id="prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Npr: Napiši Instagram post za novu kolekciju anti-aging krema. Ton: profesionalan ali pristupačan."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              URL slike{" "}
              <span className="text-gray-400">(opciono — AI će opisati sliku)</span>
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
            ref={submitRef}
            type="submit"
            disabled={loading || prompt.trim().length < 3}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generišem tekst..." : "Generiši tekst (1 kredit)"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
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

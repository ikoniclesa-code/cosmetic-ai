"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  MIN_PROMPT_LENGTH,
  MAX_PROMPT_LENGTH,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validation";

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

export default function CreateImageFromUploadPage() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      setError("Nepodržan format. Dozvoljeni: JPG, PNG, WebP.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError("Fajl je prevelik. Maksimalno 10 MB.");
      return;
    }

    setError("");
    setErrorStatus(0);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  function removeFile() {
    setFile(null);
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !file || !isPromptValid) return;

    setLoading(true);
    setError("");
    setErrorStatus(0);
    setResultUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("prompt", prompt);

      const res = await fetch("/api/generate/image-from-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setErrorStatus(res.status);
        setError(getErrorMessage(res.status, data.error));
      } else {
        setResultUrl(data.data.result_image_url);
        setCredits(data.data.credits_remaining);
      }
    } catch {
      setError("Mrežna greška. Proverite internet konekciju.");
    } finally {
      setLoading(false);
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
            <h1 className="text-lg font-bold text-gray-900">
              Kreiraj post od fotografije
            </h1>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fotografija proizvoda
            </label>
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-10 cursor-pointer hover:border-blue-400 transition-colors"
              >
                <div className="text-3xl text-gray-400 mb-2">+</div>
                <p className="text-sm text-gray-500">
                  Kliknite da izaberete sliku
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG ili WebP, max 10 MB
                </p>
              </div>
            ) : (
              <div className="relative rounded-lg border border-gray-200 bg-white p-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain rounded"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={loading}
                  className="absolute top-3 right-3 rounded-full bg-white border border-gray-300 w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-600 text-sm disabled:opacity-50"
                >
                  &times;
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700"
              >
                Instrukcije za AI
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
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Npr: Postavi ovaj proizvod na elegantnu mramornu površinu sa mekim bočnim osvetljenjem. Dodaj zlatne akcente u pozadini."
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

          <button
            type="submit"
            disabled={loading || !file || !isPromptValid}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Generisem sliku... (ovo može potrajati do 60s)"
              : "Generisi sliku (14 kredita)"}
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

        {loading && (
          <div className="mt-6 flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              AI generise sliku, molimo sacekajte...
            </p>
          </div>
        )}

        {resultUrl && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Originalna slika
                </h3>
                <img
                  src={preview}
                  alt="Original"
                  className="w-full rounded"
                />
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">
                  Generisana slika
                </h3>
                <img
                  src={resultUrl}
                  alt="Generisana"
                  className="w-full rounded"
                />
              </div>
            </div>
            <a
              href={resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-600 hover:text-blue-800"
            >
              Otvori generisanu sliku u novom tabu
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

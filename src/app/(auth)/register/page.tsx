"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.includes("@") &&
    password.length >= 8 &&
    confirmPassword.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !isFormValid) return;

    setError("");

    if (fullName.trim().length < 2) {
      setError("Ime mora imati najmanje 2 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    if (password.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Korisnik sa ovim emailom već postoji.");
        } else if (authError.message.includes("rate")) {
          setError("Previše pokušaja. Sačekajte malo.");
        } else if (authError.message.includes("password")) {
          setError("Lozinka nije dovoljno jaka. Pokušajte sa dužom lozinkom.");
        } else {
          setError("Registracija nije uspela. Pokušajte ponovo.");
        }
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Mrežna greška. Proverite internet konekciju.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Registracija</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kreirajte vaš Cosmetic AI nalog
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Puno ime
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Vaše ime i prezime"
              minLength={2}
              disabled={loading}
              autoComplete="name"
            />
            {fullName.length > 0 && fullName.trim().length < 2 && (
              <p className="text-xs text-amber-600 mt-1">
                Minimalno 2 karaktera
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email adresa
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="vas@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Minimalno 8 karaktera"
              minLength={8}
              disabled={loading}
              autoComplete="new-password"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-amber-600 mt-1">
                Minimalno 8 karaktera ({password.length}/8)
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Potvrdi lozinku
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ponovite lozinku"
              minLength={8}
              disabled={loading}
              autoComplete="new-password"
            />
            {confirmPassword.length > 0 &&
              password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Lozinke se ne poklapaju
                </p>
              )}
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Registracija u toku..." : "Registrujte se"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Već imate nalog?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Prijavite se
          </Link>
        </p>
      </div>
    </main>
  );
}

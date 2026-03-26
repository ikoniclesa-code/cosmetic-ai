import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, credits, role")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Cosmetic AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {profile?.full_name || user.email}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {profile?.credits ?? 0} kredita
            </span>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Dobrodošli, {profile?.full_name?.split(" ")[0] || "korisniče"}
        </h2>
        <p className="text-gray-500 mb-8">Šta želite da kreirate danas?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/create/text"
            className="group rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-3">T</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Kreiraj tekst
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Generišite tekst za društvene mreže
            </p>
            <span className="inline-block mt-3 text-xs text-gray-400">
              1 kredit
            </span>
          </Link>

          <Link
            href="/create/image"
            className="group rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-3">I</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Kreiraj sliku
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Generišite sliku na osnovu opisa
            </p>
            <span className="inline-block mt-3 text-xs text-gray-400">
              14 kredita
            </span>
          </Link>

          <Link
            href="/create/image-from-upload"
            className="group rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-3">P</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              Kreiraj post
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Generišite post od vaše fotografije
            </p>
            <span className="inline-block mt-3 text-xs text-gray-400">
              14 kredita
            </span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-3">
          <Link
            href="/history"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-center"
          >
            Istorija
          </Link>
          <Link
            href="/analytics"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-center"
          >
            Analitika
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-center"
          >
            Podešavanja
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 text-center"
          >
            Planovi i cene
          </Link>
        </div>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const adminSupabase = createAdminClient();
  const { data: subscription } = await adminSupabase
    .from("subscriptions")
    .select("plan_type, status, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .single();

  const planNames: Record<string, string> = {
    starter: "Starter",
    pro: "Pro",
    pro_plus: "Pro+",
  };

  const hasSub = !!subscription;
  const isActive =
    subscription?.status === "active" && !subscription?.cancel_at_period_end;
  const isCanceling =
    subscription?.status === "active" && subscription?.cancel_at_period_end;
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const periodStillValid = periodEnd ? new Date() < periodEnd : false;
  const canGenerate = isActive || (isCanceling && periodStillValid);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("sr-Latn-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <main>
      <div className="mx-auto max-w-6xl py-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Dobrodošli, {profile?.full_name?.split(" ")[0] || "korisniče"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Šta želite da kreirate danas?
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasSub && (
              <Link
                href="/settings/subscription"
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {planNames[subscription.plan_type] || subscription.plan_type}
              </Link>
            )}
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
        {!hasSub && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              Nemate aktivnu pretplatu. Izaberite plan da biste dobili kredite.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Izaberite plan
            </Link>
          </div>
        )}

        {isCanceling && periodStillValid && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              Vaša pretplata je otkazana i važi do{" "}
              <strong>{formatDate(subscription.current_period_end)}</strong>.
              Nakon toga nećete moći da generišete sadržaj.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg bg-yellow-600 px-4 py-2 text-xs font-medium text-white hover:bg-yellow-700 transition-colors"
            >
              Obnovi plan
            </Link>
          </div>
        )}

        {subscription?.status === "past_due" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between">
            <p className="text-sm text-red-700">
              Plaćanje nije uspelo. Ažurirajte način plaćanja da nastavite.
            </p>
            <Link
              href="/settings/subscription"
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              Ažuriraj plaćanje
            </Link>
          </div>
        )}

        {subscription?.status === "canceled" && (
          <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Vaša pretplata je istekla. Izaberite novi plan.
            </p>
            <Link
              href="/pricing"
              className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Izaberite plan
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={canGenerate ? "/create/text" : "/pricing"}
            className={`group rounded-xl border p-6 transition-all ${
              canGenerate
                ? "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="text-2xl mb-3">T</div>
            <h3
              className={`font-semibold ${canGenerate ? "text-gray-900 group-hover:text-blue-600" : "text-gray-500"}`}
            >
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
            href={canGenerate ? "/create/image" : "/pricing"}
            className={`group rounded-xl border p-6 transition-all ${
              canGenerate
                ? "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="text-2xl mb-3">I</div>
            <h3
              className={`font-semibold ${canGenerate ? "text-gray-900 group-hover:text-blue-600" : "text-gray-500"}`}
            >
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
            href={canGenerate ? "/create/image-from-upload" : "/pricing"}
            className={`group rounded-xl border p-6 transition-all ${
              canGenerate
                ? "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                : "border-gray-200 bg-gray-50 opacity-60"
            }`}
          >
            <div className="text-2xl mb-3">P</div>
            <h3
              className={`font-semibold ${canGenerate ? "text-gray-900 group-hover:text-blue-600" : "text-gray-500"}`}
            >
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

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Podešavanja</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upravljajte profilom, brendom i pretplatom.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a
          href="/settings/subscription"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:bg-[#0f162d] dark:hover:border-blue-700"
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Pretplata</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Status plana, period i Stripe portal.
          </p>
        </a>
        <a
          href="/settings/brand"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:bg-[#0f162d] dark:hover:border-blue-700"
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Brend</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Uredite podatke koji ulaze u AI prompt.
          </p>
        </a>
        <a
          href="/pricing"
          className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-gray-800 dark:bg-[#0f162d] dark:hover:border-blue-700"
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Planovi i cene</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Uporedite planove i aktivirajte novi paket.
          </p>
        </a>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <span className="text-green-600 text-2xl">&#10003;</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pretplata aktivirana!
        </h1>
        <p className="text-gray-500 mb-8">
          Vaša pretplata je uspešno kreirana. Krediti su dodati na vaš nalog
          i možete odmah početi da kreirate sadržaj.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Idi na Dashboard
          </Link>
          <Link
            href="/create/text"
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Kreiraj prvi sadržaj
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cosmetic AI</h1>
          <p className="text-lg text-gray-500">
            AI alat za kreiranje sadržaja za društvene mreže
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Registrujte se
          </Link>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Prijavite se
          </Link>
        </div>

        <div className="pt-4">
          <Link
            href="/pricing"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Pogledajte planove i cene
          </Link>
        </div>
      </div>
    </main>
  );
}

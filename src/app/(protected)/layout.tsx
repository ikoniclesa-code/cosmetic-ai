import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "./dashboard/logout-button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedLayoutContent>{children}</ProtectedLayoutContent>;
}

async function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, credits")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b1020] dark:text-gray-100">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#0f162d] md:block">
          <div className="mb-6 text-lg font-bold">Cosmetic AI</div>
          <nav className="space-y-1 text-sm">
            <NavItem href="/dashboard" label="Početna" />
            <NavItem href="/create/image" label="Kreiraj sliku" />
            <NavItem href="/create/text" label="Kreiraj tekst" />
            <NavItem href="/create/image-from-upload" label="Kreiraj post" />
            <NavItem href="/history" label="Istorija" />
            <NavItem href="/analytics" label="Analitika" />
            <NavItem href="/settings" label="Podešavanja" />
            <NavItem href="/pricing" label="Cenovnik" />
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-[#0f162d]/90">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Krediti</p>
                <p className="text-sm font-semibold">{profile?.credits ?? 0} tokena</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="hidden text-sm text-gray-600 dark:text-gray-300 sm:inline">
                  {profile?.full_name || user?.email}
                </span>
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {label}
    </Link>
  );
}

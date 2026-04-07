"use client";

import { useEffect, useMemo, useState } from "react";

type DerivedSubscriptionStatus =
  | "none"
  | "active"
  | "canceling"
  | "past_due"
  | "canceled"
  | "incomplete";

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  credits: number;
  role: "user" | "admin";
  created_at: string;
  subscription: {
    plan_type: "starter" | "pro" | "pro_plus";
    derived_status: DerivedSubscriptionStatus;
  } | null;
}

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  pro_plus: "Pro+",
};

function getStatusBadge(status: DerivedSubscriptionStatus) {
  switch (status) {
    case "active":
      return {
        text: "Active",
        dot: "bg-green-500",
        cls: "border-green-200 bg-green-50 text-green-700",
      };
    case "canceling":
      return {
        text: "Canceling",
        dot: "bg-yellow-500",
        cls: "border-yellow-200 bg-yellow-50 text-yellow-700",
      };
    case "past_due":
      return {
        text: "Past due",
        dot: "bg-red-500",
        cls: "border-red-200 bg-red-50 text-red-700",
      };
    case "canceled":
      return {
        text: "Canceled",
        dot: "bg-gray-400",
        cls: "border-gray-200 bg-gray-50 text-gray-700",
      };
    case "incomplete":
      return {
        text: "Incomplete",
        dot: "bg-gray-400",
        cls: "border-gray-200 bg-gray-50 text-gray-700",
      };
    default:
      return {
        text: "No subscription",
        dot: "bg-gray-400",
        cls: "border-gray-200 bg-gray-50 text-gray-600",
      };
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/users?limit=50");
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Failed to load users");
          return;
        }
        setUsers((json.data ?? []) as AdminUser[]);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <main className="p-2 md:p-4">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pregled korisnika i statusa pretplate</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#0f162d]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretraži korisnike..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#0f162d]">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Korisnik</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Krediti</th>
                <th className="px-4 py-3 text-left font-medium">Subscription</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    Učitavanje...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    Nema korisnika za prikaz.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = user.subscription?.derived_status || "none";
                  const badge = getStatusBadge(status);
                  return (
                    <tr key={user.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {user.subscription?.plan_type
                          ? PLAN_LABEL[user.subscription.plan_type]
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {user.credits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badge.cls}`}
                        >
                          <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${badge.dot}`} />
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

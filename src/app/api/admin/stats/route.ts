import { NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;

    const [
      usersResult,
      activeSubsResult,
      generationsResult,
      creditsUsedResult,
    ] = await Promise.all([
      ctx.supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      ctx.supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      ctx.supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      ctx.supabase
        .from("credit_transactions")
        .select("amount")
        .eq("type", "usage"),
    ]);

    const totalUsers = usersResult.count ?? 0;
    const activeSubscriptions = activeSubsResult.count ?? 0;
    const totalGenerations = generationsResult.count ?? 0;

    const totalCreditsUsed = (creditsUsedResult.data ?? []).reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    const [planBreakdown, recentSignups] = await Promise.all([
      ctx.supabase
        .from("subscriptions")
        .select("plan_type, status"),
      ctx.supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const planCounts: Record<string, number> = {};
    for (const sub of planBreakdown.data ?? []) {
      if (sub.status === "active") {
        planCounts[sub.plan_type] = (planCounts[sub.plan_type] || 0) + 1;
      }
    }

    await logAdminAction(ctx.supabase, ctx.adminUser.id, "view_stats");

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        totalUsers,
        activeSubscriptions,
        totalGenerations,
        totalCreditsUsed,
        planBreakdown: planCounts,
        recentSignups: recentSignups.data ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

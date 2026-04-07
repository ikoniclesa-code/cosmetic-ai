import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import type { ApiResponse } from "@/types/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;
    const { id: targetUserId } = await params;

    const [profileResult, subscriptionResult, generationsResult, creditHistoryResult] =
      await Promise.all([
        ctx.supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single(),
        ctx.supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", targetUserId)
          .single(),
        ctx.supabase
          .from("generations")
          .select("id, type, prompt, credits_used, status, ai_model, created_at")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(20),
        ctx.supabase
          .from("credit_transactions")
          .select("id, amount, type, description, created_at")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (profileResult.error || !profileResult.data) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { data: businessData } = await ctx.supabase
      .from("businesses")
      .select("*")
      .eq("user_id", targetUserId)
      .limit(1)
      .single();

    const [genCountResult, creditsSpentResult] = await Promise.all([
      ctx.supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetUserId)
        .eq("status", "completed"),
      ctx.supabase
        .from("credit_transactions")
        .select("amount")
        .eq("user_id", targetUserId)
        .eq("type", "usage"),
    ]);

    const totalGenerations = genCountResult.count ?? 0;
    const totalCreditsSpent = (creditsSpentResult.data ?? []).reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    await logAdminAction(
      ctx.supabase,
      ctx.adminUser.id,
      "view_user",
      targetUserId
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        profile: profileResult.data,
        subscription: subscriptionResult.data || null,
        business: businessData || null,
        recentGenerations: generationsResult.data ?? [],
        recentCreditHistory: creditHistoryResult.data ?? [],
        stats: {
          totalGenerations,
          totalCreditsSpent,
        },
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { getDerivedSubscriptionStatus } from "@/lib/subscription";
import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? true : false;

    const offset = (page - 1) * limit;

    let query = ctx.supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, credits, language, onboarding_completed, created_at, updated_at",
        { count: "exact" }
      );

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const allowedSortColumns = ["created_at", "full_name", "email", "credits", "role"];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : "created_at";

    const { data: users, count, error } = await query
      .order(safeSort, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const userIds = (users ?? []).map((u) => u.id);

    const { data: subscriptionsRaw } = userIds.length
      ? await ctx.supabase
          .from("subscriptions")
          .select("user_id, plan_type, status, billing_cycle")
          .in("user_id", userIds)
      : { data: [] };

    const subscriptions = (subscriptionsRaw ?? []) as SubscriptionRow[];

    const subMap = new Map(
      (subscriptions ?? []).map((s) => [s.user_id, s])
    );

    const enrichedUsers = (users ?? []).map((user) => ({
      ...user,
      subscription: subMap.get(user.id)
        ? {
            ...subMap.get(user.id),
            derived_status: getDerivedSubscriptionStatus(
              subMap.get(user.id) as SubscriptionRow
            ),
          }
        : null,
    }));

    await logAdminAction(ctx.supabase, ctx.adminUser.id, "list_users", undefined, {
      search: search || null,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

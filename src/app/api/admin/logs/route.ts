import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

type AdminLogRow = Database["public"]["Tables"]["admin_logs"]["Row"];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const action = searchParams.get("action")?.trim() || "";
    const adminId = searchParams.get("adminId")?.trim() || "";

    const offset = (page - 1) * limit;

    let query = ctx.supabase
      .from("admin_logs")
      .select("*", { count: "exact" });

    if (action) {
      query = query.eq("action", action);
    }

    if (adminId) {
      query = query.eq("admin_id", adminId);
    }

    const { data: logsRaw, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to fetch logs" },
        { status: 500 }
      );
    }

    const logs = (logsRaw ?? []) as AdminLogRow[];

    const allUserIds = new Set<string>();
    for (const log of logs) {
      allUserIds.add(log.admin_id);
      if (log.target_user_id) allUserIds.add(log.target_user_id);
    }

    const { data: profiles } = allUserIds.size
      ? await ctx.supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", Array.from(allUserIds))
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const enrichedLogs = logs.map((log) => ({
      ...log,
      admin: profileMap.get(log.admin_id) || null,
      targetUser: log.target_user_id
        ? profileMap.get(log.target_user_id) || null
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedLogs,
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

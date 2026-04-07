import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface AdminContext {
  adminUser: { id: string; email: string };
  adminProfile: ProfileRow;
  supabase: ReturnType<typeof createAdminClient>;
}

/**
 * Verifies the caller is an authenticated admin and returns an AdminContext
 * for further use, or a NextResponse error to return immediately.
 */
export async function requireAdmin(): Promise<
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: NextResponse<ApiResponse> }
> {
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const rateLimit = checkRateLimit("api", user.id);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)}s.`,
        },
        { status: 429 }
      ),
    };
  }

  const supabase = createAdminClient();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileRow | null;

  if (profileError || !profile || profile.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      adminUser: { id: user.id, email: user.email! },
      adminProfile: profile as ProfileRow,
      supabase,
    },
  };
}

export async function logAdminAction(
  supabase: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId || null,
    details: details ? (details as Database["public"]["Tables"]["admin_logs"]["Insert"]["details"]) : null,
  });
}

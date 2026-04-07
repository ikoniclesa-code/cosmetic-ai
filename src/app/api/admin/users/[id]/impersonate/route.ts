import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import type { ApiResponse } from "@/types/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;
    const { id: targetUserId } = await params;

    if (targetUserId === ctx.adminUser.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cannot impersonate yourself" },
        { status: 400 }
      );
    }

    const { data: targetProfile, error: profileError } = await ctx.supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", targetUserId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { data: linkData, error: linkError } =
      await ctx.supabase.auth.admin.generateLink({
        type: "magiclink",
        email: targetProfile.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        },
      });

    if (linkError || !linkData) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to generate impersonation link" },
        { status: 500 }
      );
    }

    await logAdminAction(
      ctx.supabase,
      ctx.adminUser.id,
      "impersonate",
      targetUserId,
      {
        target_email: targetProfile.email,
        target_name: targetProfile.full_name,
      }
    );

    const actionLink =
      linkData.properties?.action_link || linkData.properties?.hashed_token;

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        impersonationUrl: actionLink,
        targetUser: {
          id: targetProfile.id,
          email: targetProfile.email,
          fullName: targetProfile.full_name,
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

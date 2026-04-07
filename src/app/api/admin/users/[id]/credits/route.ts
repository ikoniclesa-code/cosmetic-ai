import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin";
import { addCredits } from "@/lib/credits";
import type { ApiResponse, AdminCreditAdjustmentRequest } from "@/types/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { ctx } = auth;
    const { id: targetUserId } = await params;

    const body: AdminCreditAdjustmentRequest = await request.json();

    if (typeof body.amount !== "number" || body.amount === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Amount must be a non-zero number" },
        { status: 400 }
      );
    }

    if (!body.reason || body.reason.trim().length < 3) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Reason must be at least 3 characters" },
        { status: 400 }
      );
    }

    const { data: targetProfile, error: profileError } = await ctx.supabase
      .from("profiles")
      .select("id, credits, full_name, email")
      .eq("id", targetUserId)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const previousCredits = targetProfile.credits;
    const description = `Admin adjustment by ${ctx.adminProfile.email}: ${body.reason}`;

    const newCredits = await addCredits(
      targetUserId,
      body.amount,
      "admin_adjustment",
      description
    );

    await logAdminAction(
      ctx.supabase,
      ctx.adminUser.id,
      "credit_adjustment",
      targetUserId,
      {
        previous_credits: previousCredits,
        adjustment: body.amount,
        new_credits: newCredits,
        reason: body.reason,
      }
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        userId: targetUserId,
        previousCredits,
        adjustment: body.amount,
        newCredits,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

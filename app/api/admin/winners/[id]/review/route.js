import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Validates admin role server-side.
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: Admin privileges required", status: 403 };
  }

  return { user };
}

/**
 * GET /api/admin/winners/[id]/review
 * Generates a secure, temporary signed URL for admins to inspect the winner's scorecard proof.
 */
export async function GET(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: winnerId } = await params;
  if (!winnerId) {
    return NextResponse.json({ error: "Missing winner ID" }, { status: 400 });
  }

  try {
    const { data: winner, error: winnerErr } = await adminClient
      .from("winners")
      .select("id, user_id, tier, prize_cents, proof_url, verification_status, payment_status")
      .eq("id", winnerId)
      .single();

    if (winnerErr || !winner) {
      return NextResponse.json({ error: "Winner record not found" }, { status: 404 });
    }

    if (!winner.proof_url) {
      return NextResponse.json({
        winner,
        signedUrl: null,
        message: "No proof uploaded yet by golfer",
      });
    }

    // Generate signed URL valid for 60 minutes (3600 seconds)
    const { data: signedData, error: signErr } = await adminClient.storage
      .from("winner-proofs")
      .createSignedUrl(winner.proof_url, 3600);

    if (signErr) {
      return NextResponse.json(
        { error: `Failed to create signed URL: ${signErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      winner,
      signedUrl: signedData.signedUrl,
      expires_in_seconds: 3600,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to retrieve winner proof" }, { status: 500 });
  }
}

/**
 * POST /api/admin/winners/[id]/review
 * Approves or Rejects a winner's submitted scorecard proof.
 * Body: { action: 'approve' | 'reject', note?: string }
 */
export async function POST(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: winnerId } = await params;
  if (!winnerId) {
    return NextResponse.json({ error: "Missing winner ID" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, note } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const { data: winner, error: fetchErr } = await adminClient
      .from("winners")
      .select("*")
      .eq("id", winnerId)
      .single();

    if (fetchErr || !winner) {
      return NextResponse.json({ error: "Winner record not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const { data: updatedWinner, error: updateErr } = await adminClient
      .from("winners")
      .update({
        verification_status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Winner claim ${action}d successfully`,
      winner: updatedWinner,
      note: note || null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Review submission failed" }, { status: 500 });
  }
}

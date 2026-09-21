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
 * POST /api/admin/winners/[id]/pay
 * Marks an approved winner as paid.
 * STRICT ENFORCEMENT: Allowed only when verification_status === 'approved'.
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
    const { data: winner, error: fetchErr } = await adminClient
      .from("winners")
      .select("*")
      .eq("id", winnerId)
      .single();

    if (fetchErr || !winner) {
      return NextResponse.json({ error: "Winner record not found" }, { status: 404 });
    }

    if (winner.verification_status !== "approved") {
      return NextResponse.json(
        {
          error: `Cannot pay prize. Winner verification status is '${winner.verification_status}'. Must be 'approved' first.`,
        },
        { status: 400 }
      );
    }

    if (winner.payment_status === "paid") {
      return NextResponse.json(
        { error: "This prize has already been marked as paid." },
        { status: 400 }
      );
    }

    // Mark as paid
    const { data: updatedWinner, error: updateErr } = await adminClient
      .from("winners")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", winnerId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `Prize of $${(updatedWinner.prize_cents / 100).toFixed(2)} marked as Paid successfully`,
      winner: updatedWinner,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to process prize payout" }, { status: 500 });
  }
}

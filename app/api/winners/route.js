import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * GET /api/winners
 * Returns all winning records for the currently authenticated golfer.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: winnings, error } = await adminClient
      .from("winners")
      .select(`
        id,
        draw_id,
        tier,
        prize_cents,
        proof_url,
        verification_status,
        payment_status,
        reviewed_at,
        paid_at,
        created_at,
        draws (
          month,
          winning_numbers,
          prize_pool_cents,
          published_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ winnings: winnings || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load winnings" }, { status: 500 });
  }
}

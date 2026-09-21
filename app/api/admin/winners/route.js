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
 * GET /api/admin/winners
 * Returns list of all winners with profile and draw details, filterable by status.
 */
export async function GET(request) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const drawId = searchParams.get("drawId");

    let query = adminClient
      .from("winners")
      .select(`
        id,
        tier,
        prize_cents,
        proof_url,
        verification_status,
        payment_status,
        reviewed_at,
        paid_at,
        created_at,
        user:profiles (
          id,
          full_name,
          email
        ),
        draw:draws (
          id,
          month,
          status,
          prize_pool_cents
        )
      `)
      .order("created_at", { ascending: false });

    if (drawId) {
      query = query.eq("draw_id", drawId);
    }

    if (status && status !== "all") {
      if (status === "paid") {
        query = query.eq("payment_status", "paid");
      } else {
        query = query.eq("verification_status", status);
      }
    }

    const { data: winners, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ winners: winners || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

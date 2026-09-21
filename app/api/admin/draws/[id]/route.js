import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Validates that the request comes from an authenticated admin user.
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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || profile?.role !== "admin") {
    return { error: "Forbidden: Admin privileges required", status: 403 };
  }

  return { user };
}

/**
 * GET /api/admin/draws/[id]
 * Fetch complete details of a specific draw, including entries, winners, and user profiles.
 */
export async function GET(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing draw ID" }, { status: 400 });
  }

  try {
    // 1. Fetch draw record
    const { data: draw, error: drawErr } = await adminClient
      .from("draws")
      .select("*")
      .eq("id", id)
      .single();

    if (drawErr || !draw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 });
    }

    // 2. Fetch draw entries
    const { data: entries } = await adminClient
      .from("draw_entries")
      .select(`
        id,
        user_id,
        scores_snapshot,
        match_count,
        tier,
        created_at
      `)
      .eq("draw_id", id)
      .order("match_count", { ascending: false });

    // 3. Fetch winners with profiles
    const { data: winners } = await adminClient
      .from("winners")
      .select(`
        id,
        user_id,
        tier,
        prize_cents,
        proof_url,
        verification_status,
        payment_status,
        reviewed_at,
        paid_at,
        created_at
      `)
      .eq("draw_id", id)
      .order("prize_cents", { ascending: false });

    return NextResponse.json({
      draw,
      entries: entries || [],
      winners: winners || [],
      total_entries: entries?.length || 0,
      total_winners: winners?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to retrieve draw details" }, { status: 500 });
  }
}

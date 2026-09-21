import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { simulateDraw } from "@/lib/draw/runDraw";

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
 * GET /api/admin/draws
 * List all monthly draws (draft, simulated, published)
 */
export async function GET() {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: draws, error } = await adminClient
      .from("draws")
      .select(`
        id,
        month,
        mode,
        status,
        winning_numbers,
        prize_pool_cents,
        jackpot_rollover_cents,
        published_at,
        created_at
      `)
      .order("month", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ draws: draws || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to retrieve draws" }, { status: 500 });
  }
}

/**
 * POST /api/admin/draws
 * Trigger/simulate a new draw for a specific month
 * Body: { month?: 'YYYY-MM', mode?: 'random' | 'algorithmic', options?: { weighting: 'most-frequent' | 'least-frequent' } }
 */
export async function POST(request) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { month, mode, options } = body;

    const simulation = await simulateDraw(month, mode, options);

    return NextResponse.json({
      message: `Draw simulated successfully for ${simulation.draw.month}`,
      ...simulation,
    });
  } catch (err) {
    console.error("Draw simulation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to simulate monthly draw" },
      { status: 400 }
    );
  }
}

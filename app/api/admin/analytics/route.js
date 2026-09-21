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
 * GET /api/admin/analytics
 * Returns platform overview reports: total users, active subscribers, total donations,
 * prize pools, and historical draw stats for SVG charts.
 */
export async function GET() {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 1. Total users
    const { count: totalUsers } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // 2. Active subscribers
    const { count: activeSubscribers } = await adminClient
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    // 3. Total donations
    const { data: donations } = await adminClient
      .from("donations")
      .select("amount_cents");
    const totalDonationsCents = (donations || []).reduce((sum, d) => sum + (d.amount_cents || 0), 0);

    // 4. Total prize pools and draws
    const { data: draws } = await adminClient
      .from("draws")
      .select("id, month, prize_pool_cents, jackpot_rollover_cents, status, published_at")
      .order("month", { ascending: false });

    const totalPrizePoolCents = (draws || []).reduce((sum, d) => sum + (d.prize_pool_cents || 0), 0);

    // 5. Total winners paid vs pending
    const { data: winners } = await adminClient
      .from("winners")
      .select("prize_cents, payment_status, verification_status");

    const totalPaidPrizesCents = (winners || [])
      .filter((w) => w.payment_status === "paid")
      .reduce((sum, w) => sum + (w.prize_cents || 0), 0);

    return NextResponse.json({
      metrics: {
        total_users: totalUsers || 0,
        active_subscribers: activeSubscribers || 0,
        total_donations_cents: totalDonationsCents,
        total_prize_pool_cents: totalPrizePoolCents,
        total_paid_prizes_cents: totalPaidPrizesCents,
        total_draws: draws?.length || 0,
      },
      draws: draws || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load analytics" }, { status: 500 });
  }
}

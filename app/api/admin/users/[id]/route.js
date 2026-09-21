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
 * GET /api/admin/users/[id]
 * Get user profile, full scores history, subscriptions, and winning claims.
 */
export async function GET(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    // 1. Profile
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        charity_id,
        charity_percent,
        stripe_customer_id,
        created_at,
        charity:charities (
          id,
          name
        )
      `)
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Subscriptions
    const { data: subscriptions } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 3. Scores
    const { data: scores } = await adminClient
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_on", { ascending: false });

    // 4. Winnings
    const { data: winners } = await adminClient
      .from("winners")
      .select(`
        *,
        draw:draws (
          month,
          prize_pool_cents
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      user: {
        ...profile,
        subscriptions: subscriptions || [],
        scores: scores || [],
        winners: winners || [],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user role, full_name, or manage subscription status (cancel, reactivate).
 */
export async function PATCH(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { role, full_name, subscription_status, cancel_at_period_end } = body;

    // Update profile fields if provided
    const profileUpdates = {};
    if (role && (role === "subscriber" || role === "admin")) {
      profileUpdates.role = role;
    }
    if (full_name !== undefined) {
      profileUpdates.full_name = full_name;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateProfErr } = await adminClient
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId);

      if (updateProfErr) {
        return NextResponse.json({ error: updateProfErr.message }, { status: 500 });
      }
    }

    // Update subscription if provided
    if (subscription_status !== undefined || cancel_at_period_end !== undefined) {
      const subUpdates = { updated_at: new Date().toISOString() };
      if (subscription_status) subUpdates.status = subscription_status;
      if (cancel_at_period_end !== undefined) subUpdates.cancel_at_period_end = cancel_at_period_end;

      // Find the most recent subscription for this user
      const { data: subs } = await adminClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (subs && subs.length > 0) {
        const { error: subErr } = await adminClient
          .from("subscriptions")
          .update(subUpdates)
          .eq("id", subs[0].id);

        if (subErr) {
          return NextResponse.json({ error: subErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

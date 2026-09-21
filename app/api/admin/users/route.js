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
 * GET /api/admin/users
 * Searchable list of users with subscription status, score counts, and charity info.
 */
export async function GET(request) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const role = searchParams.get("role");
    const subStatus = searchParams.get("subStatus");

    // Query profiles with joined subscriptions and charities
    let query = adminClient
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
        ),
        subscriptions (
          id,
          plan,
          status,
          current_period_end,
          cancel_at_period_end
        )
      `)
      .order("created_at", { ascending: false });

    if (role && role !== "all") {
      query = query.eq("role", role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get score counts for users
    const { data: scores } = await adminClient
      .from("scores")
      .select("user_id");

    const scoresCountMap = {};
    (scores || []).forEach((s) => {
      scoresCountMap[s.user_id] = (scoresCountMap[s.user_id] || 0) + 1;
    });

    let users = (profiles || []).map((p) => {
      // Pick latest or active subscription
      const sub = Array.isArray(p.subscriptions) && p.subscriptions.length > 0
        ? p.subscriptions.find((s) => s.status === "active") || p.subscriptions[0]
        : null;

      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        role: p.role,
        charity_id: p.charity_id,
        charity_name: p.charity?.name || null,
        charity_percent: p.charity_percent,
        stripe_customer_id: p.stripe_customer_id,
        created_at: p.created_at,
        subscription: sub,
        scores_count: scoresCountMap[p.id] || 0,
      };
    });

    // Client-specified search filtering
    if (search) {
      users = users.filter((u) =>
        (u.email && u.email.toLowerCase().includes(search)) ||
        (u.full_name && u.full_name.toLowerCase().includes(search))
      );
    }

    // Filter by subscription status if requested
    if (subStatus && subStatus !== "all") {
      users = users.filter((u) => {
        if (subStatus === "none") return !u.subscription;
        return u.subscription?.status === subStatus;
      });
    }

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

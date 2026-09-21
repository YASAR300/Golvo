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
 * GET /api/admin/charities
 * Returns list of all charities with donation counts and raised totals.
 */
export async function GET() {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { data: charities, error } = await adminClient
      .from("charities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get donations aggregate per charity
    const { data: donations } = await adminClient
      .from("donations")
      .select("charity_id, amount_cents");

    const totalsMap = {};
    (donations || []).forEach((d) => {
      if (!totalsMap[d.charity_id]) {
        totalsMap[d.charity_id] = { totalRaisedCents: 0, count: 0 };
      }
      totalsMap[d.charity_id].totalRaisedCents += d.amount_cents || 0;
      totalsMap[d.charity_id].count += 1;
    });

    const enriched = (charities || []).map((c) => ({
      ...c,
      totalRaisedCents: totalsMap[c.id]?.totalRaisedCents || 0,
      donationCount: totalsMap[c.id]?.count || 0,
    }));

    return NextResponse.json({ charities: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/charities
 * Create a new charity partner.
 */
export async function POST(request) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, slug, description, image_url, is_featured, events } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Charity name is required" }, { status: 400 });
    }

    const charitySlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data, error } = await adminClient
      .from("charities")
      .insert({
        name: name.trim(),
        slug: charitySlug,
        description: description || "",
        image_url: image_url || null,
        is_featured: !!is_featured,
        events: Array.isArray(events) ? events : [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ charity: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

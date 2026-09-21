import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { PLANS, PLAN_DETAILS } from "@/lib/constants";

/**
 * GET /api/profile/charity
 * Retrieves the current user's charity preference, percentage, and active plan info.
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
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, charity_id, charity_percent")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    let charity = null;
    if (profile?.charity_id) {
      const { data: ch } = await supabase
        .from("charities")
        .select("id, name, slug, description, image_url")
        .eq("id", profile.charity_id)
        .maybeSingle();
      charity = ch;
    }

    // Get active subscription to calculate exact dollars
    const { getSubscriptionStatus } = await import("@/lib/subscription");
    const subStatus = await getSubscriptionStatus(user.id);
    const planKey = subStatus?.plan === PLANS.YEARLY ? PLANS.YEARLY : PLANS.MONTHLY;
    const planPriceCents = PLAN_DETAILS[planKey]?.priceCents || 999;

    return NextResponse.json({
      charity_id: profile?.charity_id || null,
      charity_percent: profile?.charity_percent || 10,
      charity,
      plan: planKey,
      plan_price_cents: planPriceCents,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load charity profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile/charity
 * Updates subscriber's designated charity and allocation percentage (min 10%, max 100%).
 */
export async function PATCH(request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { charityId, charityPercent } = body;

    // Validate charityPercent
    const percent = Math.floor(Number(charityPercent));
    if (isNaN(percent) || percent < 10 || percent > 100) {
      return NextResponse.json(
        { error: "Charity contribution must be between 10% and 100%" },
        { status: 400 }
      );
    }

    // Validate charityId exists if supplied
    if (charityId) {
      const { data: charityRecord, error: chErr } = await adminClient
        .from("charities")
        .select("id, name")
        .eq("id", charityId)
        .maybeSingle();

      if (chErr || !charityRecord) {
        return NextResponse.json(
          { error: "Invalid charity selected. Please choose a verified partner." },
          { status: 400 }
        );
      }
    }

    // Update profile
    const updatePayload = {
      charity_percent: percent,
    };
    if (charityId) {
      updatePayload.charity_id = charityId;
    }

    const { data: updatedProfile, error: updateErr } = await adminClient
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("id, charity_id, charity_percent")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Charity settings updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update charity settings" }, { status: 500 });
  }
}

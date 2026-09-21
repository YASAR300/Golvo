import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/url";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", redirectUrl: "/login" },
        { status: 401 }
      );
    }

    // Retrieve stripe_customer_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active billing profile found for this account. Please subscribe first." },
        { status: 400 }
      );
    }

    const appUrl = getAppUrl();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}

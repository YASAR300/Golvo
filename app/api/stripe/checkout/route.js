import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils/url";
import { PLANS } from "@/lib/constants";

export async function POST(request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", redirectUrl: "/login?redirect=/pricing" },
        { status: 401 }
      );
    }

    // 2. Parse selected plan
    const body = await request.json().catch(() => ({}));
    const plan = body.plan === PLANS.YEARLY ? PLANS.YEARLY : PLANS.MONTHLY;

    const priceId =
      plan === PLANS.YEARLY
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for plan '${plan}' is not configured in .env.local` },
        { status: 500 }
      );
    }

    // 3. Find or create Stripe Customer
    let stripeCustomerId = null;

    // Check profiles for existing customer id
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
      }
    } catch (err) {
      console.warn("Could not retrieve customer ID from profiles:", err?.message);
    }

    // If customer doesn't exist, create in Stripe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Golvo Subscriber",
        metadata: {
          supabase_uid: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Update profiles with new stripe_customer_id via adminClient
      try {
        await adminClient
          .from("profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", user.id);
      } catch (saveErr) {
        console.warn("Could not save stripe_customer_id to profiles:", saveErr?.message);
      }
    }

    // 4. Create Stripe Checkout Session
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      },
      metadata: {
        user_id: user.id,
        plan: plan,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

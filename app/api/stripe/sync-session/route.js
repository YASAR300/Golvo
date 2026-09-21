import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/constants";

/**
 * POST /api/stripe/sync-session
 * Activates subscription directly upon return from Stripe Checkout or on-demand check,
 * ensuring immediate UI updates even if the Stripe webhook is asynchronous or unconfigured.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Fallback auth header check
    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const { data: tokenData } = await supabase.auth.getUser(token);
        if (tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { sessionId } = body;

    let stripeSub = null;
    let customerId = null;
    let plan = null;
    let userId = user.id;

    if (sessionId) {
      // 1. Retrieve checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session) {
        customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        }
        if (session.metadata?.user_id) {
          userId = session.metadata.user_id;
        }
        if (session.metadata?.plan) {
          plan = session.metadata.plan;
        }
      }
    }

    // 2. If no session or stripeSub yet, look up customer by email or existing profile
    if (!stripeSub) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle();

      customerId = profile?.stripe_customer_id;

      if (!customerId && user.email) {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers?.data?.length > 0) {
          customerId = customers.data[0].id;
        }
      }

      if (customerId) {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        if (subs?.data?.length > 0) {
          stripeSub = subs.data[0];
        }
      }
    }

    if (!stripeSub) {
      return NextResponse.json(
        { error: "No active Stripe subscription found", isSubscribed: false },
        { status: 404 }
      );
    }

    // Resolve plan
    if (!plan) {
      const interval = stripeSub.items?.data?.[0]?.price?.recurring?.interval;
      plan = interval === "year" ? PLANS.YEARLY : PLANS.MONTHLY;
    }

    // Update profile with customer ID if not already saved
    if (customerId) {
      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Check existing subscriptions for this user
    const { data: existingSubs } = await adminClient
      .from("subscriptions")
      .select("id, stripe_subscription_id")
      .or(`stripe_subscription_id.eq.${stripeSub.id},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    const currentPeriodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : null;

    let subRecord = null;

    if (existingSubs && existingSubs.length > 0) {
      const { data: updatedSub, error: updateErr } = await adminClient
        .from("subscriptions")
        .update({
          stripe_subscription_id: stripeSub.id,
          plan: plan,
          status: "active",
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: stripeSub.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubs[0].id)
        .select()
        .single();

      if (updateErr) {
        console.error("Failed to update subscription in DB:", updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      subRecord = updatedSub;
    } else {
      const { data: newSub, error: insertErr } = await adminClient
        .from("subscriptions")
        .insert({
          user_id: userId,
          stripe_subscription_id: stripeSub.id,
          plan: plan,
          status: "active",
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: stripeSub.cancel_at_period_end || false,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Failed to insert subscription in DB:", insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      subRecord = newSub;
    }

    return NextResponse.json({
      success: true,
      subscription: subRecord || {
        status: "active",
        plan: plan,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: false,
      },
    });
  } catch (err) {
    console.error("Sync session error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync session" }, { status: 500 });
  }
}

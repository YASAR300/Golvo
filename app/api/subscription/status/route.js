import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/constants";

/**
 * GET /api/subscription/status
 * Authoritative real-time check of the user's subscription status.
 * Checks Supabase DB first, then falls back directly to Stripe API by customer/email
 * so subscribers never see "Free Preview" even if database tables are syncing.
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Fallback Bearer auth
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
      return NextResponse.json({ isSubscribed: false, subscription: null }, { status: 401 });
    }

    // 1. Check Supabase subscriptions table first
    try {
      const { data: dbSub, error: dbErr } = await adminClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!dbErr && dbSub && dbSub.status === "active") {
        return NextResponse.json({ isSubscribed: true, subscription: dbSub });
      }
    } catch (e) {
      // Supabase table might not exist or cache issue; continue to Stripe fallback
    }

    // 2. Direct Stripe Verification Fallback
    // Lookup by user email or customer ID in Stripe
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });

      for (const cust of customers.data || []) {
        const subs = await stripe.subscriptions.list({
          customer: cust.id,
          status: "active",
          limit: 1,
        });

        if (subs?.data?.length > 0) {
          const s = subs.data[0];
          const interval = s.items?.data?.[0]?.price?.recurring?.interval;
          const plan = interval === "year" ? PLANS.YEARLY : PLANS.MONTHLY;
          const currentPeriodEnd = s.current_period_end
            ? new Date(s.current_period_end * 1000).toISOString()
            : null;

          const activeSub = {
            id: s.id,
            user_id: user.id,
            stripe_subscription_id: s.id,
            status: "active",
            plan: plan,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: s.cancel_at_period_end || false,
          };

          // Background sync to Supabase (safe if table exists, ignored if not)
          try {
            await adminClient.from("profiles").update({ stripe_customer_id: cust.id }).eq("id", user.id);
            await adminClient.from("subscriptions").upsert(
              {
                user_id: user.id,
                stripe_subscription_id: s.id,
                plan: plan,
                status: "active",
                current_period_end: currentPeriodEnd,
                cancel_at_period_end: s.cancel_at_period_end || false,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_subscription_id" }
            );
          } catch (syncErr) {
            // Ignored if DB table not yet created
          }

          return NextResponse.json({ isSubscribed: true, subscription: activeSub });
        }
      }
    }

    return NextResponse.json({ isSubscribed: false, subscription: null });
  } catch (err) {
    console.error("Subscription status check error:", err);
    return NextResponse.json({ isSubscribed: false, subscription: null, error: err.message });
  }
}

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { PLANS, PRIZE_POOL_PERCENT, DEFAULT_CHARITY_PERCENT } from "@/lib/constants";

/**
 * POST /api/stripe/sync-session
 * Fallback route: Activates subscription directly upon successful redirect from Stripe Checkout
 * even before the asynchronous Stripe webhook reaches the server.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json().catch(() => ({}));
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ error: "No subscription attached to session" }, { status: 400 });
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = session.metadata?.user_id || user.id;
    const plan = session.metadata?.plan || (stripeSub.items.data[0]?.price?.recurring?.interval === "year" ? PLANS.YEARLY : PLANS.MONTHLY);

    // Upsert subscription directly
    await adminClient.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: stripeSub.id,
        status: stripeSub.status === "active" || stripeSub.status === "trialing" ? "active" : stripeSub.status,
        plan: plan,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSub.cancel_at_period_end,
      },
      { onConflict: "user_id" }
    );

    return NextResponse.json({ success: true, status: "active", plan });
  } catch (err) {
    console.error("Sync session error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync session" }, { status: 500 });
  }
}

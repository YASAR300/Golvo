import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { adminClient } from "@/lib/supabase/admin";
import { PRIZE_POOL_PERCENT, PLANS } from "@/lib/constants";

/**
 * Stripe Webhook Handler
 * Verifies webhook signatures and synchronizes customer subscriptions,
 * donations, and prize pool contributions.
 */
export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // 1. Verify webhook signature if webhook secret is configured
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(body, signature || "", webhookSecret);
    } catch (err) {
      console.error(`Stripe Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // In local dev without webhook secret, parse raw payload
    try {
      event = JSON.parse(body);
      console.warn("STRIPE_WEBHOOK_SECRET not set; running in unverified local development mode.");
    } catch {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }
  }

  const { type, data } = event;

  try {
    switch (type) {
      // ------------------------------------------------------------------------
      // EVENT: checkout.session.completed
      // ------------------------------------------------------------------------
      case "checkout.session.completed": {
        const session = data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription, session.metadata?.user_id);
        } else if (session.mode === "payment" && session.metadata?.type === "independent") {
          // Record independent charity donation
          await handleIndependentDonation(session);
        }
        break;
      }

      // ------------------------------------------------------------------------
      // EVENT: customer.subscription.created & updated
      // ------------------------------------------------------------------------
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = data.object;
        await syncSubscription(subscription);
        break;
      }

      // ------------------------------------------------------------------------
      // EVENT: customer.subscription.deleted (Cancellation)
      // ------------------------------------------------------------------------
      case "customer.subscription.deleted": {
        const subscription = data.object;
        await adminClient
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      // ------------------------------------------------------------------------
      // EVENT: invoice.payment_failed
      // ------------------------------------------------------------------------
      case "invoice.payment_failed": {
        const invoice = data.object;
        if (invoice.subscription) {
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;

          await adminClient
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        break;
      }

      // ------------------------------------------------------------------------
      // EVENT: invoice.paid & invoice.payment_succeeded
      // Handles charity giveback (10-100%) and prize pool contribution (40%)
      // ------------------------------------------------------------------------
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = data.object;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        // Unhandled events are acknowledged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook event ${type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed", details: err.message },
      { status: 500 }
    );
  }
}

/**
 * Synchronizes a Stripe Subscription object with Supabase subscriptions table.
 */
async function syncSubscription(subscription, fallbackUserId = null) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // 1. Resolve Supabase user ID
  let userId = subscription.metadata?.user_id || fallbackUserId;

  if (!userId) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (profile?.id) {
      userId = profile.id;
    }
  }

  if (!userId) {
    console.warn(`Could not resolve user for Stripe Customer: ${customerId}`);
    return;
  }

  // 2. Map Stripe status to Golvo schema check constraints
  // Golvo status enum: ('active','inactive','past_due','canceled','lapsed')
  let status = "inactive";
  if (subscription.status === "active" || subscription.status === "trialing") {
    status = "active";
  } else if (subscription.status === "past_due") {
    status = "past_due";
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    status = "canceled";
  }

  // 3. Map interval to plan ('monthly' or 'yearly')
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  const plan = interval === "year" ? PLANS.YEARLY : PLANS.MONTHLY;

  // Current period end timestamp
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  // 4. Upsert into subscriptions table
  const { error } = await adminClient
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan: plan,
        status: status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );

  if (error) {
    console.error("Failed to sync subscription to database:", error);
  } else {
    console.log(`Successfully synchronized subscription ${subscription.id} for user ${userId}`);
  }
}

/**
 * Handles invoice.paid:
 * 1. Allocates charity donation (min 10% or subscriber preference).
 * 2. Allocates prize pool share (40% of net after charity).
 */
async function handleInvoicePaid(invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  // 1. Fetch user profile
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id, charity_id, charity_percent")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error || !profile) {
    console.warn(`No profile associated with customer ${customerId} on invoice ${invoice.id}`);
    return;
  }

  const amountPaidCents = invoice.amount_paid || 0;
  if (amountPaidCents <= 0) return;

  // 2. Charity Donation Share (Default: 10%, up to 100%)
  const charityPercent = profile.charity_percent || 10;
  const donationCents = Math.round(amountPaidCents * (charityPercent / 100));

  if (profile.charity_id && donationCents > 0) {
    try {
      await adminClient.from("donations").insert({
        user_id: profile.id,
        charity_id: profile.charity_id,
        amount_cents: donationCents,
        type: "subscription_share",
        stripe_payment_id:
          typeof invoice.payment_intent === "string"
            ? invoice.payment_intent
            : invoice.id,
      });
      console.log(
        `Recorded donation of $${(donationCents / 100).toFixed(2)} to charity ${profile.charity_id}`
      );
    } catch (donationErr) {
      console.error("Failed to record charity donation:", donationErr);
    }
  }

  // 3. Prize Pool Share Calculation:
  // Formula: 40% of net subscription revenue after charity deduction
  const netCents = Math.max(0, amountPaidCents - donationCents);
  const prizePoolAdditionCents = Math.round(netCents * (PRIZE_POOL_PERCENT / 100));

  // 4. Update current active draw's prize pool if a published/draft draw exists
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: "YYYY-MM"
  try {
    const { data: currentDraw } = await adminClient
      .from("draws")
      .select("id, prize_pool_cents")
      .eq("month", currentMonth)
      .maybeSingle();

    if (currentDraw) {
      const newPoolTotal = (currentDraw.prize_pool_cents || 0) + prizePoolAdditionCents;
      await adminClient
        .from("draws")
        .update({ prize_pool_cents: newPoolTotal })
        .eq("id", currentDraw.id);

      console.log(
        `Added $${(prizePoolAdditionCents / 100).toFixed(2)} to draw ${currentMonth} prize pool (Total: $${(newPoolTotal / 100).toFixed(2)})`
      );
    } else {
      console.log(
        `Prize pool allocation placeholder: $${(prizePoolAdditionCents / 100).toFixed(2)} calculated for month ${currentMonth}`
      );
    }
  } catch (drawErr) {
    console.warn("Prize pool allocation update notice:", drawErr?.message);
  }
}

/**
 * Records one-time independent charity donations
 */
async function handleIndependentDonation(session) {
  const charityId = session.metadata?.charity_id;
  const rawUserId = session.metadata?.user_id;
  const userId = rawUserId && rawUserId !== "anonymous" ? rawUserId : null;
  const amountCents = session.amount_total || 0;

  if (!charityId || amountCents <= 0) return;

  try {
    const { error } = await adminClient.from("donations").insert({
      user_id: userId,
      charity_id: charityId,
      amount_cents: amountCents,
      type: "independent",
      stripe_payment_id: session.payment_intent || session.id,
    });

    if (error) {
      console.error("Failed to record independent donation:", error);
    } else {
      console.log(
        `Recorded independent donation of $${(amountCents / 100).toFixed(2)} to charity ${charityId}`
      );
    }
  } catch (err) {
    console.error("Exception recording independent donation:", err);
  }
}


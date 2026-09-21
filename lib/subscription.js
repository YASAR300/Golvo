import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Retrieves the current subscription status for a given user.
 * Real-time query against the subscriptions table using adminClient to ensure fresh data.
 *
 * @param {string} userId - Supabase user UUID
 * @returns {Promise<{ isActive: boolean, subscription: object|null, plan: string|null, currentPeriodEnd: string|null, cancelAtPeriodEnd: boolean }>}
 */
export async function getSubscriptionStatus(userId) {
  if (!userId) {
    return {
      isActive: false,
      subscription: null,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  try {
    const { data: subscription, error } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (!error && subscription && subscription.status === "active") {
      const isPeriodValid = subscription.current_period_end
        ? new Date(subscription.current_period_end) > new Date()
        : true;

      return {
        isActive: isPeriodValid,
        subscription,
        plan: subscription.plan,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      };
    }
  } catch (dbErr) {
    // DB query failed or table does not exist, proceed to Stripe check
  }

  // Authoritative Stripe fallback check
  try {
    const { stripe } = await import("@/lib/stripe/server");
    const { PLANS } = await import("@/lib/constants");

    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    let customerIds = [];
    if (profile?.stripe_customer_id) {
      customerIds.push(profile.stripe_customer_id);
    }

    if (profile?.email) {
      const customers = await stripe.customers.list({
        email: profile.email.toLowerCase().trim(),
        limit: 5,
      });
      for (const c of customers.data || []) {
        if (!customerIds.includes(c.id)) customerIds.push(c.id);
      }
    }

    for (const custId of customerIds) {
      const subs = await stripe.subscriptions.list({
        customer: custId,
        status: "all",
        limit: 5,
      });

      for (const s of subs.data || []) {
        if (s.status === "active" || s.status === "trialing") {
          const interval = s.items?.data?.[0]?.price?.recurring?.interval;
          const plan = interval === "year" ? PLANS.YEARLY : PLANS.MONTHLY;
          const currentPeriodEnd = s.current_period_end
            ? new Date(s.current_period_end * 1000).toISOString()
            : null;

          const activeSub = {
            id: s.id,
            user_id: userId,
            stripe_subscription_id: s.id,
            status: "active",
            plan: plan,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: s.cancel_at_period_end || false,
          };

          return {
            isActive: true,
            subscription: activeSub,
            plan: plan,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: s.cancel_at_period_end || false,
          };
        }
      }
    }
  } catch (stripeErr) {
    console.warn("Stripe fallback check error in getSubscriptionStatus:", stripeErr?.message);
  }

  return {
    isActive: false,
    subscription: null,
    plan: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Server guard helper to gate restricted platform features:
 * - Certified score entry (up to 5 retained)
 * - Monthly charity draw ticket participation
 *
 * Admins bypass subscription requirements.
 * Non-subscribers receive restricted authorization with a redirectUrl to /pricing.
 *
 * @returns {Promise<{ authorized: boolean, user: object|null, role: string|null, error?: string, redirectUrl?: string, plan?: string|null }>}
 */
export async function requireActiveSubscription() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      role: null,
      error: "Authentication required. Please sign in to Golvo.",
      redirectUrl: "/login",
    };
  }

  // 1. Admins have unrestricted access to all features
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      return {
        authorized: true,
        user,
        role: "admin",
        plan: "admin",
      };
    }
  } catch {
    // Proceed to standard subscriber check
  }

  // 2. Check active subscription
  const status = await getSubscriptionStatus(user.id);
  if (!status.isActive) {
    return {
      authorized: false,
      user,
      role: "subscriber",
      error: "An active subscription is required to log scores and enter monthly charity draws.",
      redirectUrl: "/pricing",
      ...status,
    };
  }

  return {
    authorized: true,
    user,
    role: "subscriber",
    ...status,
  };
}

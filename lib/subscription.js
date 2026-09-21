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

    if (error || !subscription) {
      return {
        isActive: false,
        subscription: null,
        plan: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    // Check period expiration if current_period_end is defined
    const isPeriodValid = subscription.current_period_end
      ? new Date(subscription.current_period_end) > new Date()
      : true;

    return {
      isActive: isPeriodValid,
      subscription,
      plan: subscription.plan,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (err) {
    console.warn("getSubscriptionStatus error:", err?.message);
    return {
      isActive: false,
      subscription: null,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
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

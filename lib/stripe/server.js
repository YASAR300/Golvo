import Stripe from "stripe";

/**
 * Server-only Stripe SDK instance.
 * Initialized with process.env.STRIPE_SECRET_KEY.
 * CRITICAL: Do NOT import this file in Client Components ("use client").
 */
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set in environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  appInfo: {
    name: "Golvo Golf Subscription",
    version: "1.0.0",
  },
});

export default stripe;

/**
 * Golvo Platform Constants
 */

// Allocation percentages
export const DEFAULT_CHARITY_PERCENT = 10; // Minimum 10% of subscription goes to charity
export const PRIZE_POOL_PERCENT = 40; // 40% of net revenue after charity donation goes to monthly prize pool

// Subscription Plan Identifiers
export const PLANS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

// Plan details
export const PLAN_DETAILS = {
  [PLANS.MONTHLY]: {
    id: PLANS.MONTHLY,
    name: "Monthly Golfer",
    price: 9.99,
    priceCents: 999,
    interval: "month",
    description: "Full access to handicap tracking, 1 automatic monthly draw ticket, and charity donation.",
  },
  [PLANS.YEARLY]: {
    id: PLANS.YEARLY,
    name: "Annual Champion",
    price: 95.88,
    priceCents: 9588,
    interval: "year",
    monthlyEquivalent: 7.99,
    discountPercent: 20,
  },
};

// Default Stripe Test Prices (Fallback if not set in Vercel environment variables)
export const DEFAULT_STRIPE_PRICE_MONTHLY = "price_1UI9vfIUEU1f1CxDQXUZjemo";
export const DEFAULT_STRIPE_PRICE_YEARLY = "price_1UI9vfIUEU1f1CxDWZCSH5ys";

// Monthly Draw Configuration
export const DRAW_NUMBER_COUNT = 5;
export const DRAW_NUMBER_MIN = 1;
export const DRAW_NUMBER_MAX = 45;

// Tier distribution percentages (Must sum to 100)
export const DRAW_TIERS = {
  MATCH_5: "match5",
  MATCH_4: "match4",
  MATCH_3: "match3",
  NONE: "none",
};

export const DRAW_TIER_PERCENTAGES = {
  [DRAW_TIERS.MATCH_5]: 40, // 40% jackpot, rolls over if no winner
  [DRAW_TIERS.MATCH_4]: 35, // 35% pool
  [DRAW_TIERS.MATCH_3]: 25, // 25% pool
};

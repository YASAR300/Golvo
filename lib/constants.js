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
    description: "Save 20% yearly. Includes 12 monthly draws, priority verification, and maximum charity impact.",
  },
};

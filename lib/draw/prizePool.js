import {
  DEFAULT_CHARITY_PERCENT,
  PRIZE_POOL_PERCENT,
  PLAN_DETAILS,
  PLANS,
  DRAW_TIERS,
  DRAW_TIER_PERCENTAGES,
} from "../constants.js";

/**
 * Calculates the monthly prize pool from subscriber count or actual subscription revenue,
 * plus any incoming jackpot rollover from the prior month.
 *
 * @param {number|Array<number|{amount_cents?: number, amountPaidCents?: number, charity_percent?: number}>} subscriberInput
 * @param {number} [jackpotRolloverCents=0]
 * @returns {{ base_pool_cents: number, rollover_cents: number, total_pool_cents: number }}
 */
export function calculatePool(subscriberInput = 0, jackpotRolloverCents = 0) {
  const rollover = Math.max(0, Math.round(Number(jackpotRolloverCents) || 0));
  let basePoolCents = 0;

  if (typeof subscriberInput === "number") {
    const subscriberCount = Math.max(0, Math.floor(subscriberInput));
    // Default subscription price: $9.99 (999 cents)
    const priceCents = PLAN_DETAILS[PLANS.MONTHLY]?.priceCents || 999;
    const charityCents = Math.round(priceCents * (DEFAULT_CHARITY_PERCENT / 100));
    const netCents = Math.max(0, priceCents - charityCents);
    const perUserPoolCents = Math.round(netCents * (PRIZE_POOL_PERCENT / 100)); // ~360 cents

    basePoolCents = subscriberCount * perUserPoolCents;
  } else if (Array.isArray(subscriberInput)) {
    for (const item of subscriberInput) {
      if (typeof item === "number") {
        const charityCents = Math.round(item * (DEFAULT_CHARITY_PERCENT / 100));
        const netCents = Math.max(0, item - charityCents);
        basePoolCents += Math.round(netCents * (PRIZE_POOL_PERCENT / 100));
      } else if (typeof item === "object" && item !== null) {
        const amount = item.amount_cents ?? item.amountPaidCents ?? PLAN_DETAILS[PLANS.MONTHLY]?.priceCents ?? 999;
        const charityPercent = item.charity_percent ?? DEFAULT_CHARITY_PERCENT;
        const charityCents = Math.round(amount * (charityPercent / 100));
        const netCents = Math.max(0, amount - charityCents);
        basePoolCents += Math.round(netCents * (PRIZE_POOL_PERCENT / 100));
      }
    }
  }

  return {
    base_pool_cents: basePoolCents,
    rollover_cents: rollover,
    total_pool_cents: basePoolCents + rollover,
  };
}

/**
 * Calculates prize allocations and payouts per winning tier.
 * Splits prizes EQUALLY among winners in the same tier.
 * If no match5 winners, the jackpot (including incoming rollover) rolls over to next month.
 *
 * @param {number} poolCents - Total prize pool for current month (excluding or including rollover).
 * @param {Record<string, Array<any>|number>} winnersByTier - Winners mapped by tier (e.g. { match5: [...], match4: [...], match3: [...] }).
 * @param {number} [jackpotRolloverCents=0] - Rollover amount from previous month's draw.
 * @returns {{
 *   total_pool_cents: number,
 *   jackpot_rollover_incoming_cents: number,
 *   jackpot_rollover_outgoing_cents: number,
 *   tiers: {
 *     match5: { total_cents: number, winner_count: number, payout_per_winner_cents: number, rolled_over: boolean },
 *     match4: { total_cents: number, winner_count: number, payout_per_winner_cents: number },
 *     match3: { total_cents: number, winner_count: number, payout_per_winner_cents: number }
 *   }
 * }}
 */
export function calculateTierPayouts(poolCents = 0, winnersByTier = {}, jackpotRolloverCents = 0) {
  const basePool = Math.max(0, Math.round(Number(poolCents) || 0));
  const incomingRollover = Math.max(0, Math.round(Number(jackpotRolloverCents) || 0));

  // Helper to extract winner count whether an array or integer is supplied
  const getWinnerCount = (tierKey) => {
    const val = winnersByTier[tierKey];
    if (Array.isArray(val)) return val.length;
    if (typeof val === "number") return Math.max(0, Math.floor(val));
    return 0;
  };

  const count5 = getWinnerCount(DRAW_TIERS.MATCH_5);
  const count4 = getWinnerCount(DRAW_TIERS.MATCH_4);
  const count3 = getWinnerCount(DRAW_TIERS.MATCH_3);

  // Tier 1: Match 5 (Jackpot) - 40% of base pool + incoming rollover
  const match5BasePortion = Math.round(basePool * (DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_5] / 100));
  const match5Total = match5BasePortion + incomingRollover;
  let match5PayoutPerWinner = 0;
  let outgoingRollover = 0;
  let match5RolledOver = false;

  if (count5 > 0) {
    match5PayoutPerWinner = Math.floor(match5Total / count5);
    outgoingRollover = 0;
  } else {
    // If no match5 winner, the entire 40% jackpot amount is carried over to next month
    match5PayoutPerWinner = 0;
    outgoingRollover = match5Total;
    match5RolledOver = true;
  }

  // Tier 2: Match 4 - 35% of base pool
  const match4Total = Math.round(basePool * (DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_4] / 100));
  const match4PayoutPerWinner = count4 > 0 ? Math.floor(match4Total / count4) : 0;

  // Tier 3: Match 3 - 25% of base pool
  const match3Total = Math.round(basePool * (DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_3] / 100));
  const match3PayoutPerWinner = count3 > 0 ? Math.floor(match3Total / count3) : 0;

  return {
    total_pool_cents: basePool + incomingRollover,
    jackpot_rollover_incoming_cents: incomingRollover,
    jackpot_rollover_outgoing_cents: outgoingRollover,
    tiers: {
      [DRAW_TIERS.MATCH_5]: {
        total_cents: match5Total,
        winner_count: count5,
        payout_per_winner_cents: match5PayoutPerWinner,
        rolled_over: match5RolledOver,
      },
      [DRAW_TIERS.MATCH_4]: {
        total_cents: match4Total,
        winner_count: count4,
        payout_per_winner_cents: match4PayoutPerWinner,
      },
      [DRAW_TIERS.MATCH_3]: {
        total_cents: match3Total,
        winner_count: count3,
        payout_per_winner_cents: match3PayoutPerWinner,
      },
    },
  };
}

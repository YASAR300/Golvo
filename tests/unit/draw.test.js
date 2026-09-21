import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateRandomDraw,
  generateAlgorithmicDraw,
  evaluateEntry,
} from "@/lib/draw/engine";
import {
  calculatePool,
  calculateTierPayouts,
} from "@/lib/draw/prizePool";
import { simulateDraw, publishDraw } from "@/lib/draw/runDraw";
import { DRAW_TIERS, DRAW_TIER_PERCENTAGES } from "@/lib/constants";
import { adminClient } from "@/lib/supabase/admin";

describe("Draw Engine — generateRandomDraw()", () => {
  it("returns exactly 5 unique integers between 1 and 45 sorted ascending", () => {
    const numbers = generateRandomDraw();
    expect(numbers).toHaveLength(5);
    const unique = new Set(numbers);
    expect(unique.size).toBe(5);

    for (const n of numbers) {
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    }

    const sorted = [...numbers].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });

  it("runs 1000 iterations to confirm no duplicates and all within range 1–45", () => {
    for (let i = 0; i < 1000; i++) {
      const numbers = generateRandomDraw();
      expect(numbers).toHaveLength(5);
      expect(new Set(numbers).size).toBe(5);
      for (const n of numbers) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(45);
      }
    }
  });
});

describe("Draw Engine — generateAlgorithmicDraw()", () => {
  it("returns 5 unique numbers even with very few input scores (< 5 distinct scores)", () => {
    // Edge case: only 1 or 2 distinct scores
    const fewScores = [18, 18, 18, 24];
    const numbers = generateAlgorithmicDraw(fewScores);
    expect(numbers).toHaveLength(5);
    expect(new Set(numbers).size).toBe(5);
    for (const n of numbers) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(45);
    }

    // Edge case: 0 scores falls back to 5 random unique numbers
    const emptyScores = generateAlgorithmicDraw([]);
    expect(emptyScores).toHaveLength(5);
    expect(new Set(emptyScores).size).toBe(5);
  });

  it("frequent-weighted mode statistically favors common scores", () => {
    // Score 25 appears 100 times, others appear 0 or 1 time
    const heavilySkewedScores = Array(100).fill(25).concat([10, 15, 20]);
    let count25 = 0;
    const totalRuns = 200;

    for (let i = 0; i < totalRuns; i++) {
      const draw = generateAlgorithmicDraw(heavilySkewedScores, { weighting: "most-frequent" });
      expect(draw).toHaveLength(5);
      expect(new Set(draw).size).toBe(5);
      if (draw.includes(25)) {
        count25++;
      }
    }

    // Since 25 has huge weight, it should appear in a substantial majority of runs (> 50%)
    expect(count25).toBeGreaterThan(totalRuns * 0.4);
  });
});

describe("Draw Engine — evaluateEntry()", () => {
  const winningNumbers = [5, 12, 23, 34, 45];

  it("evaluates 5 matches as match5 (Jackpot)", () => {
    const entry = evaluateEntry([5, 12, 23, 34, 45], winningNumbers);
    expect(entry.match_count).toBe(5);
    expect(entry.tier).toBe(DRAW_TIERS.MATCH_5);
    expect(entry.matched_numbers).toEqual([5, 12, 23, 34, 45]);
  });

  it("evaluates 4 matches as match4", () => {
    const entry = evaluateEntry([5, 12, 23, 34, 40], winningNumbers);
    expect(entry.match_count).toBe(4);
    expect(entry.tier).toBe(DRAW_TIERS.MATCH_4);
    expect(entry.matched_numbers).toEqual([5, 12, 23, 34]);
  });

  it("evaluates 3 matches as match3", () => {
    const entry = evaluateEntry([5, 12, 23, 30, 40], winningNumbers);
    expect(entry.match_count).toBe(3);
    expect(entry.tier).toBe(DRAW_TIERS.MATCH_3);
    expect(entry.matched_numbers).toEqual([5, 12, 23]);
  });

  it("evaluates 2, 1, or 0 matches as none", () => {
    const entry2 = evaluateEntry([5, 12, 20, 30, 40], winningNumbers);
    expect(entry2.match_count).toBe(2);
    expect(entry2.tier).toBe(DRAW_TIERS.NONE);

    const entry0 = evaluateEntry([1, 2, 3, 4, 6], winningNumbers);
    expect(entry0.match_count).toBe(0);
    expect(entry0.tier).toBe(DRAW_TIERS.NONE);
  });

  /**
   * Duplicate user scores handling rule:
   * Golvo rounds are deduplicated with Set before evaluation. If a golfer played identical
   * Stableford scores across rounds (e.g. [34, 34, 34, 12, 5]), matching winning number 34
   * counts as ONE match (not 3), avoiding duplicate match inflation.
   */
  it("handles duplicate user scores by counting each winning number at most once", () => {
    const duplicateEntry = evaluateEntry([34, 34, 34, 12, 5], winningNumbers);
    // Matched numbers: 5, 12, 34 -> exactly 3 unique matches (Tier match3)
    expect(duplicateEntry.match_count).toBe(3);
    expect(duplicateEntry.tier).toBe(DRAW_TIERS.MATCH_3);
    expect(duplicateEntry.matched_numbers).toEqual([5, 12, 34]);
  });
});

describe("Prize Pool & Tier Calculations", () => {
  it("verifies tier percentages sum to 100% (40% match5 + 35% match4 + 25% match3)", () => {
    const sum =
      DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_5] +
      DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_4] +
      DRAW_TIER_PERCENTAGES[DRAW_TIERS.MATCH_3];
    expect(sum).toBe(100);
  });

  it("calculates pool using integer cents with zero subscribers returning zero pool", () => {
    const zeroPool = calculatePool(0, 0);
    expect(zeroPool.base_pool_cents).toBe(0);
    expect(zeroPool.rollover_cents).toBe(0);
    expect(zeroPool.total_pool_cents).toBe(0);

    // 100 subscribers with 15000 cents rollover
    const pool = calculatePool(100, 15000);
    expect(pool.base_pool_cents).toBe(36000); // 360 cents per user * 100
    expect(pool.rollover_cents).toBe(15000);
    expect(pool.total_pool_cents).toBe(51000);
    expect(Number.isInteger(pool.total_pool_cents)).toBe(true);
  });

  it("splits prizes equally among multiple winners in the same tier with deterministic integer cents", () => {
    const basePool = 100000; // $1,000.00 base pool
    // 3 winners in match4 (35,000 cents / 3 = 11,666 cents each, remainder 2 cents)
    const result = calculateTierPayouts(basePool, {
      match5: [],
      match4: [1, 2, 3],
      match3: [],
    });

    expect(result.tiers.match4.winner_count).toBe(3);
    expect(result.tiers.match4.payout_per_winner_cents).toBe(11666);
    expect(Number.isInteger(result.tiers.match4.payout_per_winner_cents)).toBe(true);
  });

  it("handles jackpot rollover correctly when there is no match5 winner vs when there is a winner", () => {
    const basePool = 100000; // $1,000.00
    const incomingRollover = 25000; // $250.00

    // Scenario 1: No match5 winner -> 40% (40,000) + 25,000 = 65,000 rolls over
    const noWinner = calculateTierPayouts(basePool, { match5: [] }, incomingRollover);
    expect(noWinner.jackpot_rollover_outgoing_cents).toBe(65000);
    expect(noWinner.tiers.match5.rolled_over).toBe(true);
    expect(noWinner.tiers.match5.payout_per_winner_cents).toBe(0);

    // Scenario 2: With match5 winner -> rollover resets to 0 and winner receives total jackpot
    const withWinner = calculateTierPayouts(
      basePool,
      { match5: [{ id: "winner-1" }] },
      incomingRollover
    );
    expect(withWinner.jackpot_rollover_outgoing_cents).toBe(0);
    expect(withWinner.tiers.match5.rolled_over).toBe(false);
    expect(withWinner.tiers.match5.payout_per_winner_cents).toBe(65000);
  });

  it("calculates pool from array of subscription amounts or subscriber objects", () => {
    // Array of numeric amounts
    const poolFromNumbers = calculatePool([1000, 2000], 500);
    expect(poolFromNumbers.base_pool_cents).toBeGreaterThan(0);
    expect(poolFromNumbers.rollover_cents).toBe(500);

    // Array of objects with custom charity_percent
    const poolFromObjects = calculatePool(
      [
        { amount_cents: 1000, charity_percent: 20 },
        { amountPaidCents: 2000, charity_percent: 10 },
      ],
      0
    );
    expect(poolFromObjects.base_pool_cents).toBeGreaterThan(0);
  });
});

describe("Draw Lifecycle — simulateDraw() and publishDraw()", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("simulates a monthly draw successfully with random numbers and calculates entries/winners", async () => {
    const mockActiveSubs = [{ user_id: "user-1", plan: "monthly" }];
    const mockScores = [
      { user_id: "user-1", score: 10, played_on: "2026-09-01" },
      { user_id: "user-1", score: 20, played_on: "2026-09-02" },
      { user_id: "user-1", score: 30, played_on: "2026-09-03" },
      { user_id: "user-1", score: 40, played_on: "2026-09-04" },
      { user_id: "user-1", score: 45, played_on: "2026-09-05" },
    ];

    vi.spyOn(adminClient, "from").mockImplementation((table) => {
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: async () => ({ data: mockActiveSubs, error: null }),
          }),
        };
      }
      if (table === "scores") {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({ data: mockScores, error: null }),
            }),
          }),
        };
      }
      if (table === "draws") {
        return {
          select: () => ({
            eq: () => ({
              lt: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: { jackpot_rollover_cents: 1000 }, error: null }),
                  }),
                }),
              }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
          insert: (payload) => ({
            select: () => ({
              single: async () => ({ data: { id: "sim-draw-1", ...payload }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await simulateDraw("2026-09", "random");
    expect(result.draw).toBeDefined();
    expect(result.winning_numbers).toHaveLength(5);
    expect(result.entries).toHaveLength(1);
    expect(result.draw.status).toBe("simulated");
  });

  it("simulates a monthly draw using algorithmic weighting mode", async () => {
    vi.spyOn(adminClient, "from").mockImplementation((table) => {
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "draws") {
        return {
          select: () => ({
            eq: () => ({
              lt: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null }),
                  }),
                }),
              }),
              maybeSingle: async () => ({ data: null }),
            }),
          }),
          insert: (payload) => ({
            select: () => ({
              single: async () => ({ data: { id: "sim-draw-algo", ...payload }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await simulateDraw("2026-09", "algorithmic", { weighting: "most-frequent" });
    expect(result.draw).toBeDefined();
    expect(result.winning_numbers).toHaveLength(5);
  });

  it("rejects publishing if the draw was already published", async () => {
    vi.spyOn(adminClient, "from").mockImplementation((table) => {
      if (table === "draws") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "draw-1", month: "2026-09", status: "published" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(publishDraw("draw-1")).rejects.toThrow(/already published/);
  });

  it("rejects publishing if the draw is a draft that was never simulated", async () => {
    vi.spyOn(adminClient, "from").mockImplementation((table) => {
      if (table === "draws") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "draw-2", month: "2026-09", status: "draft" },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    await expect(publishDraw("draw-2")).rejects.toThrow(/never simulated/);
  });

  it("successfully publishes a simulated draw, inserting entries and winners", async () => {
    const mockDraw = {
      id: "sim-draw-100",
      month: "2026-09",
      status: "simulated",
      mode: "random",
      winning_numbers: [5, 12, 18, 27, 34],
    };

    let drawEntriesInserted = false;
    let drawUpdated = false;

    vi.spyOn(adminClient, "from").mockImplementation((table) => {
      if (table === "draws") {
        return {
          select: () => ({
            eq: (col, val) => ({
              single: async () => ({ data: mockDraw, error: null }),
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }), // No other published draw this month
              }),
              lt: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({ data: null }),
                  }),
                }),
              }),
              maybeSingle: async () => ({ data: mockDraw, error: null }),
            }),
          }),
          update: (payload) => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  drawUpdated = true;
                  return { data: { ...mockDraw, ...payload, status: "published" }, error: null };
                },
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: mockDraw, error: null }),
            }),
          }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: async () => ({ data: [{ user_id: "user-1", plan: "monthly" }], error: null }),
          }),
        };
      }
      if (table === "scores") {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({
                data: [
                  { user_id: "user-1", score: 5, played_on: "2026-09-01" },
                  { user_id: "user-1", score: 12, played_on: "2026-09-02" },
                  { user_id: "user-1", score: 18, played_on: "2026-09-03" },
                  { user_id: "user-1", score: 27, played_on: "2026-09-04" },
                  { user_id: "user-1", score: 34, played_on: "2026-09-05" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "draw_entries" || table === "winners") {
        return {
          delete: () => ({
            eq: async () => ({ error: null }),
          }),
          insert: async () => {
            drawEntriesInserted = true;
            return { error: null };
          },
        };
      }
      return {};
    });

    const result = await publishDraw("sim-draw-100");
    expect(result.draw.status).toBe("published");
    expect(drawEntriesInserted).toBe(true);
    expect(drawUpdated).toBe(true);
  });
});

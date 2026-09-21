import test from "node:test";
import assert from "node:assert/strict";

import {
  generateRandomDraw,
  generateAlgorithmicDraw,
  evaluateEntry,
} from "../engine.js";

import {
  calculatePool,
  calculateTierPayouts,
} from "../prizePool.js";

import { DRAW_TIERS } from "../../constants.js";

test("Draw Engine — generateRandomDraw()", () => {
  const numbers = generateRandomDraw();

  assert.equal(numbers.length, 5, "Draw must contain exactly 5 numbers");

  // Verify unique
  const uniqueSet = new Set(numbers);
  assert.equal(uniqueSet.size, 5, "All 5 numbers must be unique");

  // Verify range 1-45
  for (const n of numbers) {
    assert.ok(Number.isInteger(n), "Number must be an integer");
    assert.ok(n >= 1 && n <= 45, `Number ${n} must be between 1 and 45`);
  }

  // Verify sorted
  const sorted = [...numbers].sort((a, b) => a - b);
  assert.deepEqual(numbers, sorted, "Numbers must be sorted in ascending order");
});

test("Draw Engine — generateAlgorithmicDraw()", () => {
  const sampleScores = [18, 18, 18, 24, 24, 30, 36, 42];
  const numbers = generateAlgorithmicDraw(sampleScores, { weighting: "most-frequent" });

  assert.equal(numbers.length, 5, "Algorithmic draw must contain 5 numbers");
  assert.equal(new Set(numbers).size, 5, "All numbers must be unique");

  // Fallback on empty input
  const fallback = generateAlgorithmicDraw([]);
  assert.equal(fallback.length, 5, "Fallback must return 5 numbers");
});

test("Draw Engine — evaluateEntry() Match Tiers", () => {
  const winningNumbers = [5, 12, 23, 34, 45];

  // Match 5 -> Jackpot
  const entry5 = evaluateEntry([5, 12, 23, 34, 45], winningNumbers);
  assert.equal(entry5.match_count, 5);
  assert.equal(entry5.tier, DRAW_TIERS.MATCH_5);
  assert.deepEqual(entry5.matched_numbers, [5, 12, 23, 34, 45]);

  // Match 4
  const entry4 = evaluateEntry([5, 12, 23, 34, 40], winningNumbers);
  assert.equal(entry4.match_count, 4);
  assert.equal(entry4.tier, DRAW_TIERS.MATCH_4);

  // Match 3
  const entry3 = evaluateEntry([5, 12, 23, 30, 40], winningNumbers);
  assert.equal(entry3.match_count, 3);
  assert.equal(entry3.tier, DRAW_TIERS.MATCH_3);

  // Match 2 -> none
  const entry2 = evaluateEntry([5, 12, 20, 30, 40], winningNumbers);
  assert.equal(entry2.match_count, 2);
  assert.equal(entry2.tier, DRAW_TIERS.NONE);

  // Match 0 -> none
  const entry0 = evaluateEntry([1, 2, 3, 4, 6], winningNumbers);
  assert.equal(entry0.match_count, 0);
  assert.equal(entry0.tier, DRAW_TIERS.NONE);
});

test("Prize Pool — calculatePool() with subscribers and rollover", () => {
  // 100 subscribers at $9.99/mo ($999 cents)
  // 10% charity = 100c, net = 899c, 40% pool = 360c per subscriber -> 36,000c
  const pool = calculatePool(100, 15000); // 15000 cents rollover

  assert.equal(pool.base_pool_cents, 36000);
  assert.equal(pool.rollover_cents, 15000);
  assert.equal(pool.total_pool_cents, 51000);
});

test("Prize Pool — calculateTierPayouts() Tie Splitting & Jackpot Rollover", () => {
  const basePool = 100000; // $1,000.00 base pool
  // match5 (40%) = 40,000c
  // match4 (35%) = 35,000c
  // match3 (25%) = 25,000c

  // Scenario A: No match5 winner -> Jackpot rolls over
  const scenarioA = calculateTierPayouts(
    basePool,
    {
      match5: [],
      match4: [1, 2], // 2 winners
      match3: [1, 2, 3, 4, 5], // 5 winners
    },
    10000 // $100 incoming rollover
  );

  // Match 5: 40,000 + 10,000 = 50,000 rolls over
  assert.equal(scenarioA.tiers.match5.winner_count, 0);
  assert.equal(scenarioA.tiers.match5.payout_per_winner_cents, 0);
  assert.equal(scenarioA.jackpot_rollover_outgoing_cents, 50000);
  assert.equal(scenarioA.tiers.match5.rolled_over, true);

  // Match 4: 35,000 split equally between 2 winners = 17,500 each
  assert.equal(scenarioA.tiers.match4.winner_count, 2);
  assert.equal(scenarioA.tiers.match4.payout_per_winner_cents, 17500);

  // Match 3: 25,000 split equally between 5 winners = 5,000 each
  assert.equal(scenarioA.tiers.match3.winner_count, 5);
  assert.equal(scenarioA.tiers.match3.payout_per_winner_cents, 5000);

  // Scenario B: 1 Match 5 winner -> Takes entire 40% + rollover
  const scenarioB = calculateTierPayouts(
    basePool,
    {
      match5: [{ id: "user-winner" }],
      match4: [],
      match3: [],
    },
    20000 // $200 incoming rollover
  );

  // Total jackpot = 40,000 + 20,000 = 60,000
  assert.equal(scenarioB.tiers.match5.winner_count, 1);
  assert.equal(scenarioB.tiers.match5.payout_per_winner_cents, 60000);
  assert.equal(scenarioB.jackpot_rollover_outgoing_cents, 0);
  assert.equal(scenarioB.tiers.match5.rolled_over, false);
});

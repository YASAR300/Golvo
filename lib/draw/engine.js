import {
  DRAW_NUMBER_COUNT,
  DRAW_NUMBER_MIN,
  DRAW_NUMBER_MAX,
  DRAW_TIERS,
} from "../constants.js";

/**
 * Generates 5 unique cryptographically/pseudo-random numbers between 1 and 45.
 * @returns {number[]} Array of 5 unique numbers sorted in ascending order.
 */
export function generateRandomDraw() {
  const pool = [];
  for (let i = DRAW_NUMBER_MIN; i <= DRAW_NUMBER_MAX; i++) {
    pool.push(i);
  }

  // Fisher-Yates shuffle subset of 5
  const result = [];
  for (let i = 0; i < DRAW_NUMBER_COUNT; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result.push(pool[randomIndex]);
    pool.splice(randomIndex, 1);
  }

  return result.sort((a, b) => a - b);
}

/**
 * Generates 5 unique numbers weighted by score frequency across active subscriber scores.
 * @param {Array<number|{score: number}>} allScores - Collection of subscriber scores.
 * @param {Object} [options]
 * @param {'most-frequent'|'least-frequent'} [options.weighting='most-frequent']
 * @returns {number[]} Array of 5 unique numbers sorted in ascending order.
 */
export function generateAlgorithmicDraw(allScores = [], options = { weighting: "most-frequent" }) {
  const weighting = options?.weighting === "least-frequent" ? "least-frequent" : "most-frequent";

  // Normalize scores to plain integers
  const scores = allScores
    .map((s) => (typeof s === "object" && s !== null ? s.score : s))
    .filter((s) => typeof s === "number" && s >= DRAW_NUMBER_MIN && s <= DRAW_NUMBER_MAX);

  // If no scores exist, fall back to pure random draw
  if (scores.length === 0) {
    return generateRandomDraw();
  }

  // Count occurrences for each valid number 1..45
  const frequencyMap = new Map();
  for (let num = DRAW_NUMBER_MIN; num <= DRAW_NUMBER_MAX; num++) {
    frequencyMap.set(num, 0);
  }
  for (const score of scores) {
    frequencyMap.set(score, (frequencyMap.get(score) || 0) + 1);
  }

  // Calculate weights
  const items = [];
  const maxFreq = Math.max(...frequencyMap.values(), 1);

  for (let num = DRAW_NUMBER_MIN; num <= DRAW_NUMBER_MAX; num++) {
    const freq = frequencyMap.get(num);
    let weight = 1;

    if (weighting === "most-frequent") {
      // Numbers that appear more often have higher weights (base weight 1 to prevent 0)
      weight = 1 + freq * 3;
    } else {
      // Numbers that appear least often (or never) have higher weights
      weight = 1 + (maxFreq - freq) * 3;
    }

    items.push({ num, weight });
  }

  // Weighted random selection without replacement for 5 numbers
  const selected = [];
  const available = [...items];

  for (let step = 0; step < DRAW_NUMBER_COUNT; step++) {
    const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
    let randomThreshold = Math.random() * totalWeight;

    let pickedIndex = 0;
    for (let i = 0; i < available.length; i++) {
      randomThreshold -= available[i].weight;
      if (randomThreshold <= 0) {
        pickedIndex = i;
        break;
      }
    }

    selected.push(available[pickedIndex].num);
    available.splice(pickedIndex, 1);
  }

  return selected.sort((a, b) => a - b);
}

/**
 * Evaluates a user's 5 Stableford scores against the 5 winning draw numbers.
 * @param {number[]} userScores - The user's active scores.
 * @param {number[]} winningNumbers - The 5 drawn winning numbers.
 * @returns {{ match_count: number, tier: string, matched_numbers: number[] }}
 */
export function evaluateEntry(userScores = [], winningNumbers = []) {
  if (!Array.isArray(userScores) || !Array.isArray(winningNumbers)) {
    return {
      match_count: 0,
      tier: DRAW_TIERS.NONE,
      matched_numbers: [],
    };
  }

  // Ensure unique numbers within user scores to avoid duplicate match inflation
  const uniqueUserScores = Array.from(new Set(userScores));
  const winningSet = new Set(winningNumbers);

  const matchedNumbers = uniqueUserScores
    .filter((num) => winningSet.has(num))
    .sort((a, b) => a - b);

  const matchCount = matchedNumbers.length;

  let tier = DRAW_TIERS.NONE;
  if (matchCount === 5) {
    tier = DRAW_TIERS.MATCH_5;
  } else if (matchCount === 4) {
    tier = DRAW_TIERS.MATCH_4;
  } else if (matchCount === 3) {
    tier = DRAW_TIERS.MATCH_3;
  }

  return {
    match_count: matchCount,
    tier,
    matched_numbers: matchedNumbers,
  };
}

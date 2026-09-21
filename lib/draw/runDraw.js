import { adminClient } from "@/lib/supabase/admin";
import { generateRandomDraw, generateAlgorithmicDraw, evaluateEntry } from "./engine";
import { calculatePool, calculateTierPayouts } from "./prizePool";
import { DRAW_TIERS } from "@/lib/constants";

/**
 * Simulates a monthly charity draw for all currently active subscribers.
 * Creates/updates a draw record with status 'simulated' without publishing.
 *
 * @param {string} [month] - Month in 'YYYY-MM' format. Defaults to current month.
 * @param {'random'|'algorithmic'} [mode='random'] - Draw generation algorithm.
 * @param {Object} [options] - Additional generator options (e.g. weighting: 'most-frequent' | 'least-frequent').
 * @returns {Promise<Object>} Simulation result with draw, entries, winners, and pool breakdown.
 */
export async function simulateDraw(month, mode = "random", options = {}) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const drawMode = mode === "algorithmic" ? "algorithmic" : "random";

  // 1. Fetch active subscribers
  const { data: activeSubs, error: subsError } = await adminClient
    .from("subscriptions")
    .select("user_id, plan")
    .eq("status", "active");

  if (subsError) {
    throw new Error(`Failed to fetch active subscriptions: ${subsError.message}`);
  }

  const subscriberUserIds = (activeSubs || []).map((s) => s.user_id);

  // 2. Fetch latest 5 scores for each active subscriber
  const userScoresMap = new Map();
  const allSubscriberScores = [];

  if (subscriberUserIds.length > 0) {
    const { data: rawScores, error: scoresError } = await adminClient
      .from("scores")
      .select("user_id, score, played_on")
      .in("user_id", subscriberUserIds)
      .order("played_on", { ascending: false });

    if (scoresError) {
      throw new Error(`Failed to fetch subscriber scores: ${scoresError.message}`);
    }

    // Group up to 5 scores per user
    for (const row of rawScores || []) {
      if (!userScoresMap.has(row.user_id)) {
        userScoresMap.set(row.user_id, []);
      }
      const existing = userScoresMap.get(row.user_id);
      if (existing.length < 5) {
        existing.push(row.score);
        allSubscriberScores.push(row.score);
      }
    }
  }

  // 3. Generate 5 winning numbers
  let winningNumbers;
  if (drawMode === "algorithmic") {
    winningNumbers = generateAlgorithmicDraw(allSubscriberScores, options);
  } else {
    winningNumbers = generateRandomDraw();
  }

  // 4. Retrieve incoming jackpot rollover from previous published draw
  let incomingRolloverCents = 0;
  try {
    const { data: previousDraw } = await adminClient
      .from("draws")
      .select("jackpot_rollover_cents")
      .eq("status", "published")
      .lt("month", targetMonth)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousDraw?.jackpot_rollover_cents) {
      incomingRolloverCents = previousDraw.jackpot_rollover_cents;
    }
  } catch (err) {
    console.warn("Could not retrieve previous draw rollover:", err?.message);
  }

  // 5. Evaluate entries for every active subscriber with 5 scores
  const entries = [];
  const winnersByTier = {
    [DRAW_TIERS.MATCH_5]: [],
    [DRAW_TIERS.MATCH_4]: [],
    [DRAW_TIERS.MATCH_3]: [],
  };

  for (const userId of subscriberUserIds) {
    const scores = (userScoresMap.get(userId) || []).sort((a, b) => a - b);
    const evaluation = evaluateEntry(scores, winningNumbers);

    const entryItem = {
      user_id: userId,
      scores_snapshot: scores,
      match_count: evaluation.match_count,
      tier: evaluation.tier,
      matched_numbers: evaluation.matched_numbers,
    };

    entries.push(entryItem);

    if (evaluation.tier in winnersByTier) {
      winnersByTier[evaluation.tier].push(entryItem);
    }
  }

  // 6. Calculate prize pool and payouts
  const pool = calculatePool(subscriberUserIds.length, incomingRolloverCents);
  const payoutCalculation = calculateTierPayouts(
    pool.base_pool_cents,
    winnersByTier,
    incomingRolloverCents
  );

  // 7. Save or update simulation in draws table
  const { data: existingDraw } = await adminClient
    .from("draws")
    .select("id, status")
    .eq("month", targetMonth)
    .maybeSingle();

  if (existingDraw && existingDraw.status === "published") {
    throw new Error(`A draw for month ${targetMonth} has already been published and cannot be modified.`);
  }

  let drawRecord;
  const drawPayload = {
    month: targetMonth,
    mode: drawMode,
    status: "simulated",
    winning_numbers: winningNumbers,
    prize_pool_cents: payoutCalculation.total_pool_cents,
    jackpot_rollover_cents: payoutCalculation.jackpot_rollover_outgoing_cents,
  };

  if (existingDraw) {
    const { data: updatedDraw, error: updateErr } = await adminClient
      .from("draws")
      .update(drawPayload)
      .eq("id", existingDraw.id)
      .select()
      .single();

    if (updateErr) throw new Error(`Failed to update simulated draw: ${updateErr.message}`);
    drawRecord = updatedDraw;
  } else {
    const { data: newDraw, error: insertErr } = await adminClient
      .from("draws")
      .insert(drawPayload)
      .select()
      .single();

    if (insertErr) throw new Error(`Failed to insert simulated draw: ${insertErr.message}`);
    drawRecord = newDraw;
  }

  // Compile winners list with allocated prizes
  const winners = [];
  for (const tierKey of [DRAW_TIERS.MATCH_5, DRAW_TIERS.MATCH_4, DRAW_TIERS.MATCH_3]) {
    const tierWinners = winnersByTier[tierKey] || [];
    const payoutPerWinner = payoutCalculation.tiers[tierKey]?.payout_per_winner_cents || 0;

    for (const w of tierWinners) {
      winners.push({
        user_id: w.user_id,
        tier: tierKey,
        prize_cents: payoutPerWinner,
        match_count: w.match_count,
        matched_numbers: w.matched_numbers,
      });
    }
  }

  return {
    draw: drawRecord,
    winning_numbers: winningNumbers,
    pool,
    payouts: payoutCalculation,
    entries_count: entries.length,
    winners_count: winners.length,
    winners,
    entries,
  };
}

/**
 * Publishes a previously simulated draw:
 * - Validates draw status
 * - Writes immutable draw_entries
 * - Writes immutable winners rows (verification_status: 'pending_proof', payment_status: 'pending')
 * - Sets published_at and status = 'published'
 *
 * @param {string} drawId - UUID of the simulated draw to publish.
 * @returns {Promise<Object>} Final published draw details.
 */
export async function publishDraw(drawId) {
  // 1. Fetch draw
  const { data: draw, error: drawErr } = await adminClient
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .single();

  if (drawErr || !draw) {
    throw new Error(`Draw not found: ${drawErr?.message || "Invalid draw ID"}`);
  }

  if (draw.status === "published") {
    throw new Error(`Draw ${draw.month} is already published.`);
  }

  // 2. Ensure only ONE published draw per month
  const { data: existingPublished } = await adminClient
    .from("draws")
    .select("id")
    .eq("month", draw.month)
    .eq("status", "published")
    .maybeSingle();

  if (existingPublished) {
    throw new Error(`A published draw already exists for month ${draw.month}.`);
  }

  // 3. Re-simulate/evaluate entries against winning numbers to ensure atomic integrity
  const simulation = await simulateDraw(draw.month, draw.mode);

  // 4. Clean up any existing entries/winners for this drawId
  await adminClient.from("draw_entries").delete().eq("draw_id", draw.id);
  await adminClient.from("winners").delete().eq("draw_id", draw.id);

  // 5. Insert draw entries
  if (simulation.entries.length > 0) {
    const entriesToInsert = simulation.entries.map((e) => ({
      draw_id: draw.id,
      user_id: e.user_id,
      scores_snapshot: e.scores_snapshot,
      match_count: e.match_count,
      tier: e.tier,
    }));

    const { error: entriesInsertErr } = await adminClient
      .from("draw_entries")
      .insert(entriesToInsert);

    if (entriesInsertErr) {
      throw new Error(`Failed to write draw entries: ${entriesInsertErr.message}`);
    }
  }

  // 6. Insert winners rows
  if (simulation.winners.length > 0) {
    const winnersToInsert = simulation.winners.map((w) => ({
      draw_id: draw.id,
      user_id: w.user_id,
      tier: w.tier,
      prize_cents: w.prize_cents,
      verification_status: "pending_proof",
      payment_status: "pending",
    }));

    const { error: winnersInsertErr } = await adminClient
      .from("winners")
      .insert(winnersToInsert);

    if (winnersInsertErr) {
      throw new Error(`Failed to write winners: ${winnersInsertErr.message}`);
    }
  }

  // 7. Update draw to published
  const { data: publishedDraw, error: pubErr } = await adminClient
    .from("draws")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      winning_numbers: simulation.winning_numbers,
      prize_pool_cents: simulation.payouts.total_pool_cents,
      jackpot_rollover_cents: simulation.payouts.jackpot_rollover_outgoing_cents,
    })
    .eq("id", draw.id)
    .select()
    .single();

  if (pubErr) {
    throw new Error(`Failed to finalize draw publish: ${pubErr.message}`);
  }

  return {
    draw: publishedDraw,
    entries_count: simulation.entries.length,
    winners_count: simulation.winners.length,
    jackpot_rollover_cents: simulation.payouts.jackpot_rollover_outgoing_cents,
    payouts: simulation.payouts,
  };
}

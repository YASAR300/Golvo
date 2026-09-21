import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireActiveSubscription } from "@/lib/subscription";
import { scoreSchema } from "@/lib/validators/score";

/**
 * GET /api/scores
 * Returns the authenticated user's latest 5 scores, reverse chronological.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scores, error } = await adminClient
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching scores:", error);
      return NextResponse.json({ scores: [] }, { status: 200 });
    }

    return NextResponse.json({ scores: scores || [] });
  } catch (error) {
    console.error("GET /api/scores exception:", error);
    return NextResponse.json(
      { error: "Failed to retrieve scores", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scores
 * Adds a new round score (1-45).
 * - Requires active subscription.
 * - Rejects duplicate date.
 * - Enforces rolling 5-score retention (replaces oldest score beyond 5).
 */
export async function POST(request) {
  try {
    // 1. Subscription Guard
    const auth = await requireActiveSubscription();
    if (!auth.authorized) {
      return NextResponse.json(
        {
          error:
            auth.error ||
            "An active subscription is required to record scores and participate in monthly draws.",
          redirectUrl: auth.redirectUrl || "/pricing",
        },
        { status: 403 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await request.json().catch(() => ({}));
    const rawData = {
      score: body.score !== undefined ? Number(body.score) : undefined,
      playedOn: body.playedOn ? String(body.playedOn).trim() : undefined,
    };

    const validation = scoreSchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Invalid score data submitted";
      return NextResponse.json(
        { error: firstErrorMessage, fieldErrors },
        { status: 400 }
      );
    }

    const { score, playedOn } = validation.data;
    const userId = auth.user.id;

    // 3. Reject Duplicate Date
    const { data: existingDateScore } = await adminClient
      .from("scores")
      .select("id, score, played_on")
      .eq("user_id", userId)
      .eq("played_on", playedOn)
      .maybeSingle();

    if (existingDateScore) {
      return NextResponse.json(
        {
          error: `A round has already been recorded for ${playedOn} (${existingDateScore.score} pts). You may edit or delete that entry instead.`,
          duplicateDate: playedOn,
          existingScoreId: existingDateScore.id,
        },
        { status: 409 }
      );
    }

    // 4. Insert New Score
    const { data: newScore, error: insertError } = await adminClient
      .from("scores")
      .insert({
        user_id: userId,
        score,
        played_on: playedOn,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Score insertion error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to save score. Please try again." },
        { status: 500 }
      );
    }

    // 5. Server-side Rolling 5-Score Retention Rule
    // Query all scores for user sorted newest to oldest. If more than 5 exist, prune oldest.
    try {
      const { data: allUserScores } = await adminClient
        .from("scores")
        .select("id")
        .eq("user_id", userId)
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false });

      if (allUserScores && allUserScores.length > 5) {
        const idsToDelete = allUserScores.slice(5).map((s) => s.id);
        if (idsToDelete.length > 0) {
          await adminClient.from("scores").delete().in("id", idsToDelete);
        }
      }
    } catch (retentionErr) {
      console.warn("Rolling retention check notice:", retentionErr?.message);
    }

    // 6. Return updated list of 5 scores
    const { data: updatedScores } = await adminClient
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json(
      {
        success: true,
        message: "Round score successfully recorded!",
        score: newScore,
        scores: updatedScores || [newScore],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/scores exception:", error);
    return NextResponse.json(
      { error: "Internal server error while saving score", details: error.message },
      { status: 500 }
    );
  }
}

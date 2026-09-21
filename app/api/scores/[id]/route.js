import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireActiveSubscription } from "@/lib/subscription";
import { updateScoreSchema } from "@/lib/validators/score";

/**
 * PATCH /api/scores/[id]
 * Updates an existing round's score or date.
 */
export async function PATCH(request, context) {
  try {
    const auth = await requireActiveSubscription();
    if (!auth.authorized) {
      return NextResponse.json(
        {
          error: auth.error || "Subscription required",
          redirectUrl: auth.redirectUrl || "/pricing",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing score ID" }, { status: 400 });
    }

    const userId = auth.user.id;

    // Verify ownership
    const { data: existingScore, error: fetchErr } = await adminClient
      .from("scores")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !existingScore) {
      return NextResponse.json(
        { error: "Score not found or you do not have permission to edit it." },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json().catch(() => ({}));
    const rawData = {};
    if (body.score !== undefined) rawData.score = Number(body.score);
    if (body.playedOn !== undefined) rawData.playedOn = String(body.playedOn).trim();

    const validation = updateScoreSchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Invalid update data";
      return NextResponse.json(
        { error: firstErrorMessage, fieldErrors },
        { status: 400 }
      );
    }

    const updatePayload = {};
    if (validation.data.score !== undefined) {
      updatePayload.score = validation.data.score;
    }

    if (validation.data.playedOn !== undefined) {
      const newPlayedOn = validation.data.playedOn;
      // If date is changing, ensure no other round exists on that date
      if (newPlayedOn !== existingScore.played_on) {
        const { data: conflictScore } = await adminClient
          .from("scores")
          .select("id, score")
          .eq("user_id", userId)
          .eq("played_on", newPlayedOn)
          .neq("id", id)
          .maybeSingle();

        if (conflictScore) {
          return NextResponse.json(
            {
              error: `Another round already exists for ${newPlayedOn} (${conflictScore.score} pts). Each date can only have one entry.`,
              duplicateDate: newPlayedOn,
            },
            { status: 409 }
          );
        }
      }
      updatePayload.played_on = newPlayedOn;
    }

    const { data: updatedScore, error: updateErr } = await adminClient
      .from("scores")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateErr) {
      console.error("Score update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to update score entry." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Score updated successfully",
      score: updatedScore,
    });
  } catch (error) {
    console.error("PATCH /api/scores/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update score", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scores/[id]
 * Deletes a recorded round score.
 */
export async function DELETE(request, context) {
  try {
    const auth = await requireActiveSubscription();
    if (!auth.authorized) {
      return NextResponse.json(
        {
          error: auth.error || "Subscription required",
          redirectUrl: auth.redirectUrl || "/pricing",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing score ID" }, { status: 400 });
    }

    const userId = auth.user.id;

    // Verify ownership and delete
    const { error: deleteErr } = await adminClient
      .from("scores")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteErr) {
      console.error("Score deletion error:", deleteErr);
      return NextResponse.json(
        { error: "Failed to delete score entry." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Score deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/scores/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete score", details: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Validates admin role server-side.
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Forbidden: Admin privileges required", status: 403 };
  }

  return { user };
}

/**
 * GET /api/admin/users/[id]/scores
 * Get all scores for a user.
 */
export async function GET(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    const { data: scores, error } = await adminClient
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("played_on", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scores: scores || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/users/[id]/scores
 * Insert a new score (1-45) on a given date for a user.
 */
export async function POST(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { score, played_on } = body;

    const parsedScore = parseInt(score, 10);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 45) {
      return NextResponse.json({ error: "Score must be an integer between 1 and 45" }, { status: 400 });
    }

    if (!played_on) {
      return NextResponse.json({ error: "Date played_on is required" }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from("scores")
      .upsert(
        {
          user_id: userId,
          score: parsedScore,
          played_on,
        },
        { onConflict: "user_id,played_on" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ score: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]/scores?scoreId=...
 * Remove a user's score.
 */
export async function DELETE(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: userId } = await params;
  const { searchParams } = new URL(request.url);
  const scoreId = searchParams.get("scoreId");

  if (!userId || !scoreId) {
    return NextResponse.json({ error: "Missing userId or scoreId" }, { status: 400 });
  }

  try {
    const { error } = await adminClient
      .from("scores")
      .delete()
      .eq("id", scoreId)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

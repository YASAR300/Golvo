import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishDraw } from "@/lib/draw/runDraw";

/**
 * Validates that the request comes from an authenticated admin user.
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

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr || profile?.role !== "admin") {
    return { error: "Forbidden: Admin privileges required", status: 403 };
  }

  return { user };
}

/**
 * POST /api/admin/draws/[id]/publish
 * Finalizes and publishes the simulated draw
 */
export async function POST(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing draw ID" }, { status: 400 });
  }

  try {
    const result = await publishDraw(id);

    return NextResponse.json({
      message: `Draw for ${result.draw.month} successfully published!`,
      ...result,
    });
  } catch (err) {
    console.error("Publish draw error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to publish draw" },
      { status: 400 }
    );
  }
}

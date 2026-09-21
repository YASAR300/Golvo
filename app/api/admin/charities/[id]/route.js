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
 * PATCH /api/admin/charities/[id]
 * Edit charity details.
 */
export async function PATCH(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: charityId } = await params;
  if (!charityId) {
    return NextResponse.json({ error: "Missing charity ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, image_url, is_featured, events, is_active } = body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (slug !== undefined) {
      updates.slug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }
    if (description !== undefined) updates.description = description;
    if (image_url !== undefined) updates.image_url = image_url;
    if (is_featured !== undefined) updates.is_featured = !!is_featured;
    if (events !== undefined) updates.events = Array.isArray(events) ? events : [];
    if (is_active !== undefined) updates.is_active = !!is_active;

    const { data, error } = await adminClient
      .from("charities")
      .update(updates)
      .eq("id", charityId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ charity: data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/charities/[id]
 * Remove charity from platform.
 */
export async function DELETE(request, { params }) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: charityId } = await params;
  if (!charityId) {
    return NextResponse.json({ error: "Missing charity ID" }, { status: 400 });
  }

  try {
    const { error } = await adminClient
      .from("charities")
      .delete()
      .eq("id", charityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

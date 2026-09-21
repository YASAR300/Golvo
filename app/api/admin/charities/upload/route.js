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
 * POST /api/admin/charities/upload
 * Uploads media file to Supabase Storage bucket "charity-media"
 */
export async function POST(request) {
  const auth = await verifyAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Valid file is required" }, { status: 400 });
    }

    const bucketName = "charity-media";

    // Ensure bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketExists = (buckets || []).some((b) => b.name === bucketName);
    if (!bucketExists) {
      await adminClient.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error: uploadErr } = await adminClient.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from(bucketName)
      .getPublicUrl(filename);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: data.path,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

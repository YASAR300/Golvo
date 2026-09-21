import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * POST /api/winners/[id]/proof
 * Uploads a verified scorecard screenshot to Supabase private storage (winner-proofs),
 * sets verification_status = 'submitted', and updates proof_url.
 */
export async function POST(request, { params }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: winnerId } = await params;
  if (!winnerId) {
    return NextResponse.json({ error: "Missing winner record ID" }, { status: 400 });
  }

  try {
    // 1. Verify winner record ownership
    const { data: winner, error: winnerErr } = await adminClient
      .from("winners")
      .select("id, user_id, verification_status, payment_status")
      .eq("id", winnerId)
      .single();

    if (winnerErr || !winner) {
      return NextResponse.json({ error: "Winner record not found" }, { status: 404 });
    }

    if (winner.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this winner record" }, { status: 403 });
    }

    if (winner.verification_status === "approved" || winner.payment_status === "paid") {
      return NextResponse.json(
        { error: "This prize claim has already been approved or paid." },
        { status: 400 }
      );
    }

    // 2. Parse uploaded file from multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a PNG, JPG, or WEBP screenshot." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit. Please upload a smaller image." },
        { status: 400 }
      );
    }

    // 3. Upload to private Supabase Storage bucket 'winner-proofs'
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `${user.id}/${winnerId}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure bucket exists or upload with adminClient
    const { error: uploadError } = await adminClient.storage
      .from("winner-proofs")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 4. Update winners record: proof_url and verification_status = 'submitted'
    const { data: updatedWinner, error: updateErr } = await adminClient
      .from("winners")
      .update({
        proof_url: storagePath,
        verification_status: "submitted",
      })
      .eq("id", winnerId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to update winner status: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Scorecard proof submitted successfully! Review pending.",
      winner: updatedWinner,
    });
  } catch (err) {
    console.error("Proof submission exception:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process proof upload" },
      { status: 500 }
    );
  }
}

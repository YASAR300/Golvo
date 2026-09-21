import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  const isLocal = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const canonicalUrl = process.env.APP_URL || "https://golvo.vercel.app";
  const origin = !isLocal ? canonicalUrl.replace(/\/$/, "") : requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // If a specific next destination was requested (e.g. /reset-password)
      if (next) {
        return NextResponse.redirect(new URL(next, origin));
      }

      // Check user profile for charity selection and role
      try {
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, charity_id")
          .eq("id", data.user.id)
          .maybeSingle();

        // If user has not completed profile (no charity assigned) and profile exists
        if (!profileErr && profile && !profile.charity_id) {
          return NextResponse.redirect(new URL("/complete-profile", origin));
        }

        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", origin));
        }
      } catch (e) {
        console.warn("Callback profile query error:", e);
      }

      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  // If code exchange failed or expired
  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(errorUrl);
}

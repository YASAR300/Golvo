import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // If a specific next destination was requested (e.g. /reset-password)
      if (next) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      // Check user profile for charity selection and role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, charity_id")
        .eq("id", data.user.id)
        .maybeSingle();

      // If user has not completed profile (no charity assigned), redirect to onboarding
      if (!profile?.charity_id) {
        return NextResponse.redirect(new URL("/complete-profile", requestUrl.origin));
      }

      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      }

      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  // If code exchange failed or expired
  const errorUrl = new URL("/login", requestUrl.origin);
  errorUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(errorUrl);
}

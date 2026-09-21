"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeProfileSchema,
} from "@/lib/validators/auth";
import { getAppUrl } from "@/lib/utils/url";

/**
 * Server Action: Initiate Google OAuth sign in
 */
export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const appUrl = getAppUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    return { error: error.message || "Failed to initialize Google authentication." };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: "Could not retrieve Google authentication URL." };
}

/**
 * Server Action: Complete Google Profile (Charity Onboarding)
 */
export async function completeGoogleProfileAction(prevState, formData) {
  const rawData = {
    fullName: formData.get("fullName"),
    charityId: formData.get("charityId"),
  };

  const validation = completeProfileSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors)[0]?.[0] || "Invalid submission data",
      fieldErrors,
    };
  }

  const { fullName, charityId } = validation.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  // Safely update profile with charity selection
  try {
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          charity_id: charityId,
          charity_percent: 10,
          role: "subscriber",
        },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.warn("Profiles upsert notice:", upsertError.message);
    }
  } catch (err) {
    console.warn("Profiles upsert caught exception:", err?.message);
  }

  redirect("/dashboard");
}


/**
 * Server Action: User Login
 */
export async function loginAction(prevState, formData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors)[0]?.[0] || "Invalid login credentials",
      fieldErrors,
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("email not confirmed")) {
      // Auto-confirm with adminClient and retry
      try {
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const foundUser = usersData?.users?.find((u) => u.email === email);
        if (foundUser) {
          await adminClient.auth.admin.updateUserById(foundUser.id, {
            email_confirm: true,
          });
          const retry = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!retry.error && retry.data?.user) {
            redirect("/dashboard");
          }
        }
      } catch {
        // Fallback to error message
      }
      return {
        error: "Please confirm your email address before signing in. Check your inbox.",
      };
    }
    if (error.message?.toLowerCase().includes("invalid login credentials")) {
      return {
        error: "Incorrect email or password. Please try again.",
      };
    }
    return {
      error: error.message || "Failed to sign in. Please try again.",
    };
  }

  if (!data?.user) {
    return { error: "Authentication failed. Please try again." };
  }

  // Check user role from profiles table (safe query)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      redirect("/admin");
    }
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.warn("Could not query profile role:", err?.message);
  }

  redirect("/dashboard");
}

/**
 * Server Action: User Registration (Signup)
 */
export async function signupAction(prevState, formData) {
  const rawData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    charityId: formData.get("charityId"),
  };

  const validation = signupSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors)[0]?.[0] || "Invalid registration data",
      fieldErrors,
    };
  }

  const { fullName, email, password, charityId } = validation.data;
  const supabase = await createClient();
  const appUrl = getAppUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        charity_id: charityId,
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already registered")) {
      return {
        error: "An account with this email already exists. Please log in.",
      };
    }
    return {
      error: error.message || "Unable to create account. Please try again.",
    };
  }

  // Detect duplicate if identities array is empty (Supabase security feature)
  if (data?.user?.identities && data.user.identities.length === 0) {
    return {
      error: "An account with this email address already exists. Please log in.",
    };
  }

  // If user was created, auto-confirm their email and upsert profile
  if (data?.user) {
    try {
      if (adminClient?.auth?.admin) {
        await adminClient.auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        });
      }
    } catch (adminErr) {
      console.warn("Auto-confirm notice:", adminErr?.message);
    }

    try {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            charity_id: charityId,
            charity_percent: 10,
            role: "subscriber",
          },
          { onConflict: "id" }
        );
    } catch (profileErr) {
      console.warn("Profile save notice:", profileErr?.message);
    }
  }

  // Establish active session immediately so user doesn't have to log in manually
  if (!data?.session) {
    try {
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (signInErr) {
      console.warn("Direct sign-in notice:", signInErr?.message);
    }
  }

  redirect("/dashboard");
}

/**
 * Server Action: Logout
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Server Action: Forgot Password
 */
export async function forgotPasswordAction(prevState, formData) {
  const rawData = {
    email: formData.get("email"),
  };

  const validation = forgotPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      error: "Please enter a valid email address",
    };
  }

  const { email } = validation.data;
  const supabase = await createClient();
  const appUrl = getAppUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error: error.message || "Unable to send reset instructions.",
    };
  }

  return {
    success: true,
    message: "If an account exists with this email, password reset instructions have been sent.",
  };
}

/**
 * Server Action: Reset Password
 */
export async function resetPasswordAction(prevState, formData) {
  const rawData = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = resetPasswordSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    return {
      error: Object.values(fieldErrors)[0]?.[0] || "Invalid password data",
      fieldErrors,
    };
  }

  const { password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("session")) {
      return {
        error: "Your reset link has expired or is invalid. Please request a new one.",
      };
    }
    return {
      error: error.message || "Failed to update password. Please try again.",
    };
  }

  return {
    success: true,
    message: "Password updated successfully! Redirecting to dashboard...",
  };
}

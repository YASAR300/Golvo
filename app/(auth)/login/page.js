"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { BackStarButton } from "@/components/ui/BackStarButton";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/utils/url";
import { loginAction } from "../actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const appUrl = getAppUrl();
      const { error } = await supabase.auth.signInWithOAuth({
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
        setErrorMessage(error.message);
        toast.error(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setErrorMessage("Failed to initiate Google sign-in. Please try again.");
      toast.error("Failed to connect to Google");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      const res = await loginAction(null, formData);

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsLoading(false);
      }
    } catch {
      // Next.js redirect throws a special internal error which is caught by Next.js router
      // If genuine network failure:
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-[#5E6AD2]/30">
      {/* Top ambient radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(94, 106, 210, 0.22) 0%, rgba(8, 9, 10, 0) 100%)",
        }}
      />

      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-block group focus-visible:outline-none">
          <Logo size={40} textClassName="text-xl" />
        </Link>
      </div>

      {/* Centered Glass Card */}
      <div className="relative w-full max-w-md rounded-[12px] bg-[#0F1011]/85 border border-white/[0.1] p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
        
        {/* Interactive Corner Star: click to navigate back */}
        <BackStarButton fallbackUrl="/" />

        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-[#F7F8F8]">
            Welcome back
          </h1>
          <p className="text-xs text-[#8A8F98]">
            Sign in to access your Stableford scores and active draw tickets.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-[6px] bg-[#EB5757]/10 border border-[#EB5757]/20 text-xs text-[#EB5757]">
            {errorMessage}
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="mb-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            leftIcon={!isGoogleLoading && <GoogleIcon size={18} />}
            className="w-full h-11 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-white transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0F1011] px-3 text-[#8A8F98] text-[11px] tracking-wider font-medium">
                Or continue with email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="golfer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-medium uppercase tracking-wider text-[#8A8F98]">
                Password
              </span>
              <Link
                href="/forgot-password"
                className="text-xs text-[#8A95FF] hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-[#8A8F98] hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-semibold mt-2"
            rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? "Signing in..." : "Sign in to Golvo"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-xs text-[#8A8F98]">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-white hover:underline font-medium ml-1"
          >
            Create an account
          </Link>
        </div>

      </div>

      <div className="mt-8 text-xs text-[#8A8F98]">
        Protected by 256-bit TLS encryption & Supabase Auth
      </div>
    </div>
  );
}

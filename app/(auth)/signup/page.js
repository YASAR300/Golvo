"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Lock, Mail, User, Heart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Logo } from "@/components/ui/Logo";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { BackStarButton } from "@/components/ui/BackStarButton";
import { createClient } from "@/lib/supabase/client";
import { signupAction } from "../actions";

const defaultCharityOptions = [
  { value: "youth-on-course", label: "Youth on Course — Subsidized rounds for youth players" },
  { value: "first-tee", label: "First Tee Foundation — Character education through golf" },
  { value: "adaptive-golf-association", label: "Adaptive Golf Association — Adaptive equipment & instruction" },
  { value: "pga-hope", label: "PGA HOPE — Veterans & military rehabilitation clinics" },
  { value: "women-in-golf-foundation", label: "Women in Golf Foundation — Collegiate pathways" },
  { value: "save-the-greens", label: "Save the Greens Trust — Eco-sanctuaries & fairway stewardship" },
];

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charityId, setCharityId] = useState("");
  const [charities, setCharities] = useState(defaultCharityOptions);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
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
      setErrorMessage("Failed to initiate Google sign-up. Please try again.");
      toast.error("Failed to connect to Google");
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    async function loadCharities() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("charities")
          .select("id, name, slug")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          setCharities(
            data.map((c) => ({
              value: c.id,
              label: c.name,
            }))
          );
          setCharityId(data[0].id);
        } else {
          setCharityId(defaultCharityOptions[0].value);
        }
      } catch {
        setCharityId(defaultCharityOptions[0].value);
      }
    }
    loadCharities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("charityId", charityId);

      const res = await signupAction(null, formData);

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsLoading(false);
      } else {
        toast.success("Welcome to Golvo!");
        router.push("/dashboard");
      }
    } catch {
      // Next.js redirect
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
            Create your account
          </h1>
          <p className="text-xs text-[#8A8F98]">
            Start logging certified rounds and enter monthly charity draws.
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
            onClick={handleGoogleSignUp}
            isLoading={isGoogleLoading}
            leftIcon={!isGoogleLoading && <GoogleIcon size={18} />}
            className="w-full h-11 text-sm font-medium bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.1] text-white transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {isGoogleLoading ? "Connecting to Google..." : "Sign up with Google"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0F1011] px-3 text-[#8A8F98] text-[11px] tracking-wider font-medium">
                Or register with email
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Rory McIlroy"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            leftIcon={<User className="w-4 h-4" />}
          />

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

          <Input
            label="Password (min. 8 characters + 1 number)"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
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

          {/* Charity Selector */}
          <div className="space-y-1.5 pt-1">
            <Select
              label="Select Beneficiary Charity"
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
              required
              options={charities}
            />
            <p className="text-[11px] text-[#4CC38A] flex items-center gap-1.5 pt-0.5">
              <Heart className="w-3 h-3 shrink-0 text-[#EB5757]" />
              <span>Min. 10% of your subscription goes to your chosen charity</span>
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full h-11 text-sm font-semibold mt-3"
            rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
          >
            {isLoading ? "Creating account..." : "Complete Registration"}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-xs text-[#8A8F98]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white hover:underline font-medium ml-1"
          >
            Sign in
          </Link>
        </div>

      </div>

      <div className="mt-8 text-xs text-[#8A8F98]">
        By signing up, you agree to Golvo&apos;s Terms of Service & Privacy Policy.
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { BackStarButton } from "@/components/ui/BackStarButton";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      const res = await resetPasswordAction(null, formData);

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsLoading(false);
      } else if (res?.success) {
        setIsSuccess(true);
        toast.success(res.message);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
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
        <BackStarButton fallbackUrl="/login" />

        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-[#F7F8F8]">
            Set new password
          </h1>
          <p className="text-xs text-[#8A8F98]">
            Enter your new secure password below to regain access.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-[6px] bg-[#EB5757]/10 border border-[#EB5757]/20 text-xs text-[#EB5757]">
            {errorMessage}
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-white underline"
              >
                Request a new link
              </Link>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#4CC38A]/10 border border-[#4CC38A]/30 flex items-center justify-center mx-auto text-[#4CC38A]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">
                Password updated!
              </h2>
              <p className="text-xs text-[#8A8F98]">
                Redirecting you to your golfer dashboard...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password (min 8 chars, 1 number)"
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

            <Input
              label="Confirm New Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-11 text-sm font-semibold mt-3"
              rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Updating password..." : "Save New Password"}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-xs text-[#8A8F98]">
          <Link
            href="/login"
            className="text-white hover:underline font-medium"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { SparkleStar } from "@/components/doodles";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("email", email);

      const res = await forgotPasswordAction(null, formData);

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
      } else if (res?.success) {
        setIsSubmitted(true);
        setSuccessMessage(res.message);
        toast.success("Instructions sent! Check your inbox.");
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
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
        
        {/* ONE Small Doodle SparkleStar strictly in the corner */}
        <div className="absolute top-5 right-5 text-white/30 pointer-events-none">
          <SparkleStar size={18} variant="4-point" />
        </div>

        <div className="space-y-1 mb-6">
          <h1 className="text-xl font-bold tracking-tight text-[#F7F8F8]">
            Reset your password
          </h1>
          <p className="text-xs text-[#8A8F98]">
            Enter your registered email and we will send you a secure recovery link.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-[6px] bg-[#EB5757]/10 border border-[#EB5757]/20 text-xs text-[#EB5757]">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#4CC38A]/10 border border-[#4CC38A]/30 flex items-center justify-center mx-auto text-[#4CC38A]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-white">
                Check your inbox
              </h2>
              <p className="text-xs text-[#8A8F98] max-w-sm mx-auto leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
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

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="w-full h-11 text-sm font-semibold mt-2"
              rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Sending link..." : "Send Recovery Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-xs text-[#8A8F98]">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-white hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}

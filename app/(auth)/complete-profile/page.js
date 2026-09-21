"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Mail, User, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Logo } from "@/components/ui/Logo";
import { SparkleStar } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";
import { completeGoogleProfileAction } from "../actions";

const defaultCharityOptions = [
  { value: "youth-on-course", label: "Youth on Course — Subsidized rounds for youth players" },
  { value: "first-tee", label: "First Tee Foundation — Character education through golf" },
  { value: "adaptive-golf-association", label: "Adaptive Golf Association — Adaptive equipment & instruction" },
  { value: "pga-hope", label: "PGA HOPE — Veterans & military rehabilitation clinics" },
  { value: "women-in-golf-foundation", label: "Women in Golf Foundation — Collegiate pathways" },
  { value: "save-the-greens", label: "Save the Greens Trust — Eco-sanctuaries & fairway stewardship" },
];

export default function CompleteProfilePage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [charityId, setCharityId] = useState("");
  const [charities, setCharities] = useState(defaultCharityOptions);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUserDataAndCharities() {
      try {
        const supabase = createClient();

        // 1. Fetch current authenticated user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || "");
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.user_name ||
            "";
          setFullName(name);
        }

        // 2. Fetch charities from Supabase
        const { data: charityData, error: charityError } = await supabase
          .from("charities")
          .select("id, name, slug")
          .eq("is_active", true);

        if (!charityError && charityData && charityData.length > 0) {
          setCharities(
            charityData.map((c) => ({
              value: c.id,
              label: c.name,
            }))
          );
          setCharityId(charityData[0].id);
        } else {
          setCharityId(defaultCharityOptions[0].value);
        }
      } catch (err) {
        console.error("Error loading user profile or charities:", err);
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUserDataAndCharities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.set("fullName", fullName);
      formData.set("charityId", charityId);

      const res = await completeGoogleProfileAction(null, formData);

      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
        setIsSubmitting(false);
      }
    } catch {
      // Next.js redirect to /dashboard
      setIsSubmitting(false);
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
          <div className="flex items-center gap-1.5 text-xs text-[#4CC38A] font-medium mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Google Account Verified</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#F7F8F8]">
            Complete your profile
          </h1>
          <p className="text-xs text-[#8A8F98]">
            Finalize your golfer details and choose the charity your subscription supports.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-[6px] bg-[#EB5757]/10 border border-[#EB5757]/20 text-xs text-[#EB5757]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Golfer Name"
            type="text"
            placeholder="e.g. Rory McIlroy"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            leftIcon={<User className="w-4 h-4" />}
            disabled={isLoadingUser}
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wider text-[#8A8F98]">
              Connected Email
            </label>
            <Input
              type="email"
              value={email}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
              className="bg-white/[0.03] text-[#8A8F98] cursor-not-allowed border-white/[0.06]"
            />
          </div>

          {/* Charity Selector */}
          <div className="space-y-1.5 pt-1">
            <Select
              label="Select Beneficiary Charity"
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
              required
              options={charities}
              disabled={isLoadingUser}
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
            isLoading={isSubmitting || isLoadingUser}
            className="w-full h-11 text-sm font-semibold mt-4"
            rightIcon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting ? "Finalizing profile..." : "Save & Continue to Dashboard"}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-xs text-[#8A8F98]">
        You can update your beneficiary charity anytime from your account settings.
      </div>
    </div>
  );
}

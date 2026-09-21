"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Check,
  Sparkles,
  Heart,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { SparkleStar } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PLAN_DETAILS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(PLANS.YEARLY);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadUserAndSubscription() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;

        if (isMounted && currentUser) {
          setUser(currentUser);

          // Authoritative subscription check
          try {
            const statusRes = await fetch("/api/subscription/status", { cache: "no-store" });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (isMounted && statusData.isSubscribed && statusData.subscription) {
                setSubscription(statusData.subscription);
              }
            }
          } catch (e) {
            console.warn("Pricing status check:", e);
          }
        } else {
          // Fallback to getUser()
          const { data: userData } = await supabase.auth.getUser();
          if (isMounted && userData?.user) {
            setUser(userData.user);
          }
        }
      } catch (err) {
        console.warn("Could not load subscription details:", err?.message);
      }
    }

    loadUserAndSubscription();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckout = async (plan) => {
    setIsLoadingCheckout(true);
    setCheckoutPlan(plan);

    try {
      const supabase = createClient();
      let activeUser = user;
      let token = null;

      // Check fresh session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        activeUser = sessionData.session.user;
        token = sessionData.session.access_token;
        setUser(activeUser);
      }

      // Fallback to getUser() if session was not cached
      if (!activeUser) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          activeUser = userData.user;
          setUser(activeUser);
        }
      }

      if (!activeUser) {
        setIsLoadingCheckout(false);
        setCheckoutPlan(null);
        toast("Please sign in or create an account first", { icon: "🔒" });
        router.push(`/login?redirect=/pricing`);
        return;
      }

      const toastId = toast.loading("Initiating secure Stripe checkout...");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data?.url) {
        toast.success("Redirecting to Stripe...", { id: toastId });
        window.location.href = data.url;
        return;
      }

      if (data?.redirectUrl) {
        toast.dismiss(toastId);
        router.push(data.redirectUrl);
        return;
      }

      toast.error(data?.error || "Failed to initialize checkout session", { id: toastId });
      setIsLoadingCheckout(false);
      setCheckoutPlan(null);
    } catch {
      toast.error("Checkout connection failed. Please try again.", { id: toastId });
      setIsLoadingCheckout(false);
      setCheckoutPlan(null);
    }
  };

  const handlePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Failed to open customer portal");
        setIsLoadingPortal(false);
      }
    } catch {
      toast.error("Billing portal request failed");
      setIsLoadingPortal(false);
    }
  };

  const isCurrentActive = subscription?.status === "active";

  const monthlyFeatures = [
    "1 Active 5-score draw ticket entered automatically every month",
    "Continuous Stableford handicap tracking & score history",
    "Customizable charity give-back (10% to 100%)",
    "Eligible for 5-number monthly jackpot rollover prizes",
    "Cancel or pause anytime with one click",
  ];

  const yearlyFeatures = [
    "12 Consecutive monthly jackpot draw entries (Full year)",
    "20% Discount compared to monthly billing ($24/year savings)",
    "Priority fast-track prize claim & scorecard verification",
    "Customizable charity allocation percentage",
    "Continuous Stableford handicap tracking & score history",
    "Supporter badge on monthly public winners board",
    "Eligible for 5-number monthly jackpot rollover prizes",
  ];

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] selection:bg-[#5E6AD2]/30 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24 relative overflow-hidden">
        {/* Top Ambient Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 0%, rgba(94, 106, 210, 0.20) 0%, rgba(8, 9, 10, 0) 100%)",
          }}
        />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header & Subtitle */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#8A95FF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transparent Golf Draw Membership</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F7F8F8] leading-tight">
              Play golf. Back charity. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F7F8F8] to-[#8A95FF]">
                Enter every monthly draw.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#8A8F98] max-w-2xl mx-auto leading-relaxed">
              Every Golvo membership directs a minimum 10% directly to your chosen partner charity,
              with 40% of net funding the monthly 5-number jackpot draw.
            </p>

            {/* Active Subscription Banner */}
            {isCurrentActive && (
              <div className="p-4 rounded-[12px] bg-[#4CC38A]/10 border border-[#4CC38A]/25 max-w-md mx-auto flex items-center justify-between gap-3 text-xs text-[#4CC38A] shadow-lg">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#4CC38A]" />
                  <span>
                    You are subscribed to the{" "}
                    <strong>{subscription.plan === "yearly" ? "Annual Champion" : "Monthly Golfer"}</strong>
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePortal}
                  isLoading={isLoadingPortal}
                  className="text-xs h-7 px-3 bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/10"
                >
                  Manage Billing
                </Button>
              </div>
            )}

            {/* Interactive Plan Switcher */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex items-center p-1.5 rounded-full bg-[#121315] border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(PLANS.MONTHLY)}
                  className={cn(
                    "px-5 py-2 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer",
                    selectedPlan === PLANS.MONTHLY
                      ? "bg-[#1E2024] text-white shadow-md border border-white/15"
                      : "text-[#8A8F98] hover:text-white"
                  )}
                >
                  Monthly billing
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(PLANS.YEARLY)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-full transition-all duration-200 cursor-pointer",
                    selectedPlan === PLANS.YEARLY
                      ? "bg-[#1E2024] text-white shadow-md border border-white/15"
                      : "text-[#8A8F98] hover:text-white"
                  )}
                >
                  <span>Annual billing</span>
                  <span className="bg-[#4CC38A]/20 text-[#4CC38A] border border-[#4CC38A]/35 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch pt-4">
            {/* Monthly Card */}
            <div
              onClick={() => setSelectedPlan(PLANS.MONTHLY)}
              className={cn(
                "rounded-[16px] p-7 sm:p-8 flex flex-col justify-between relative bg-[#0F1011] transition-all duration-300 cursor-pointer border",
                selectedPlan === PLANS.MONTHLY
                  ? "border-[#5E6AD2] shadow-[0_0_40px_rgba(94,106,210,0.22)] ring-1 ring-[#5E6AD2]/50"
                  : "border-white/[0.08] hover:border-white/20 hover:bg-[#121315]"
              )}
            >
              <div className="space-y-6">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {PLAN_DETAILS[PLANS.MONTHLY].name}
                    </h3>
                    <p className="text-xs text-[#8A8F98] mt-1">
                      {PLAN_DETAILS[PLANS.MONTHLY].description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[#8A8F98]">
                    1 Draw / Mo
                  </span>
                </div>

                {/* Price Display */}
                <div className="pt-1 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      $9.99
                    </span>
                    <span className="text-sm font-medium text-[#8A8F98]">/ month</span>
                  </div>
                  <p className="text-xs text-[#8A8F98] mt-1">
                    Billed monthly · Cancel or pause anytime
                  </p>
                </div>

                {/* Charity Give-back Highlight Box */}
                <div className="p-3.5 rounded-[10px] bg-[#EB5757]/10 border border-[#EB5757]/25 flex items-center gap-3 text-xs text-[#FF9E9E]">
                  <Heart className="w-4 h-4 text-[#EB5757] fill-[#EB5757]/30 shrink-0" />
                  <div>
                    Min. <strong className="text-white font-semibold">10% ($1.00/mo)</strong> directly funds your chosen charity
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98]">
                    What&apos;s included:
                  </p>
                  <ul className="space-y-3 text-xs">
                    {monthlyFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#4CC38A]/15 border border-[#4CC38A]/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#4CC38A]" />
                        </div>
                        <span className="text-[#D0D4DC] leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Action */}
              <div className="pt-8">
                <Button
                  variant={selectedPlan === PLANS.MONTHLY ? "primary" : "secondary"}
                  size="lg"
                  className="w-full font-semibold h-11"
                  isLoading={isLoadingCheckout && checkoutPlan === PLANS.MONTHLY}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(PLANS.MONTHLY);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isCurrentActive && subscription.plan === PLANS.MONTHLY
                    ? "Current Active Plan"
                    : "Subscribe Monthly ($9.99/mo)"}
                </Button>
              </div>
            </div>

            {/* Annual Champion (Featured Card) */}
            <div
              onClick={() => setSelectedPlan(PLANS.YEARLY)}
              className={cn(
                "rounded-[16px] p-7 sm:p-8 flex flex-col justify-between relative bg-[#0F1011] transition-all duration-300 cursor-pointer border",
                selectedPlan === PLANS.YEARLY
                  ? "border-[#5E6AD2] shadow-[0_0_50px_rgba(94,106,210,0.28)] ring-2 ring-[#5E6AD2]/60"
                  : "border-white/[0.08] hover:border-white/20 hover:bg-[#121315]"
              )}
            >
              {/* Floating Best Value Pill */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#5E6AD2] to-[#7B86E8] text-white text-[11px] font-bold shadow-[0_0_16px_rgba(94,106,210,0.6)] border border-white/20">
                  <Sparkles className="w-3 h-3 text-[#F2C94C]" />
                  Best Value — Save 20%
                </span>
              </div>

              <div className="space-y-6 pt-1">
                {/* Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      {PLAN_DETAILS[PLANS.YEARLY].name}
                      <Trophy className="w-4 h-4 text-[#F2C94C]" />
                    </h3>
                    <p className="text-xs text-[#8A8F98] mt-1">
                      {PLAN_DETAILS[PLANS.YEARLY].description}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 text-[#8A95FF]">
                    12 Draws / Yr
                  </span>
                </div>

                {/* Price Display */}
                <div className="pt-1 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      $7.99
                    </span>
                    <span className="text-sm font-medium text-[#8A8F98]">/ month</span>
                  </div>
                  <p className="text-xs text-[#8A95FF] font-medium mt-1">
                    Billed annually as $95.88/yr (Save $24 vs monthly)
                  </p>
                </div>

                {/* Charity Give-back Highlight Box */}
                <div className="p-3.5 rounded-[10px] bg-[#EB5757]/10 border border-[#EB5757]/25 flex items-center gap-3 text-xs text-[#FF9E9E]">
                  <Heart className="w-4 h-4 text-[#EB5757] fill-[#EB5757]/30 shrink-0" />
                  <div>
                    Min. <strong className="text-white font-semibold">10% ($9.59/yr)</strong> guaranteed to your chosen charity
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98]">
                    Everything in Monthly, plus:
                  </p>
                  <ul className="space-y-3 text-xs">
                    {yearlyFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#4CC38A]/15 border border-[#4CC38A]/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#4CC38A]" />
                        </div>
                        <span className="text-[#D0D4DC] leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Action */}
              <div className="pt-8">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold h-11 bg-[#5E6AD2] hover:bg-[#6875E8] shadow-[0_0_24px_rgba(94,106,210,0.4)] text-white"
                  isLoading={isLoadingCheckout && checkoutPlan === PLANS.YEARLY}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(PLANS.YEARLY);
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isCurrentActive && subscription.plan === PLANS.YEARLY
                    ? "Current Active Plan"
                    : "Subscribe Annual ($95.88/yr)"}
                </Button>
              </div>
            </div>
          </div>

          {/* Trust & Guarantee Section */}
          <div className="max-w-3xl mx-auto pt-8 border-t border-white/[0.08] text-center space-y-4 text-xs text-[#8A8F98]">
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 font-medium">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#5E6AD2]" />
                Secure Stripe Checkout
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#4CC38A]" />
                Cancel or Pause Anytime
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#EB5757]" />
                100% Tax Compliant Giving
              </span>
            </div>
            <p className="max-w-xl mx-auto leading-relaxed">
              Subscriptions fund official golf non-profit partners and 40% net jackpot prize pool.
              No hidden fees, no lock-in contracts. Manage your billing details anytime with one click.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

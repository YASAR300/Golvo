"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Check, Sparkles, Heart, ShieldCheck, CreditCard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { DoodleCheck, SparkleStar } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PLAN_DETAILS } from "@/lib/constants";

export default function PricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(PLANS.YEARLY);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    async function loadUserAndSubscription() {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser);

        if (currentUser) {
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status, plan, current_period_end")
            .eq("user_id", currentUser.id)
            .eq("status", "active")
            .maybeSingle();

          setSubscription(sub || null);
        }
      } catch (err) {
        console.warn("Could not load subscription details:", err?.message);
      }
    }

    loadUserAndSubscription();
  }, []);

  const handleCheckout = async (plan) => {
    if (!user) {
      toast("Please sign in or create an account first", { icon: "🔒" });
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setIsLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data?.redirectUrl) {
        router.push(data.redirectUrl);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Failed to initialize checkout session");
        setIsLoadingCheckout(false);
      }
    } catch (err) {
      toast.error("Checkout connection failed. Please try again.");
      setIsLoadingCheckout(false);
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

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] selection:bg-[#5E6AD2]/30 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 0%, rgba(94, 106, 210, 0.18) 0%, rgba(8, 9, 10, 0) 100%)",
          }}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <Badge variant="accent" size="sm">
              Membership Plans
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F7F8F8]">
              Play golf. Back charity. <br />
              Enter every monthly draw.
            </h1>
            <p className="text-sm sm:text-base text-[#8A8F98] max-w-xl mx-auto">
              Every subscription directs a minimum 10% directly to your chosen partner charity, with 40% of net funding the monthly 5-number jackpot.
            </p>

            {/* Active Subscription Banner */}
            {isCurrentActive && (
              <div className="p-4 rounded-[10px] bg-[#4CC38A]/10 border border-[#4CC38A]/25 max-w-md mx-auto flex items-center justify-between gap-3 text-xs text-[#4CC38A]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Active Plan: <strong>{subscription.plan === "yearly" ? "Annual" : "Monthly"}</strong>
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePortal}
                  isLoading={isLoadingPortal}
                  className="text-xs h-7 px-3 bg-white/[0.06] hover:bg-white/[0.12] text-white"
                >
                  Manage Billing
                </Button>
              </div>
            )}

            {/* Plan Switcher */}
            <div className="inline-flex items-center p-1 rounded-full bg-[#141516] border border-white/10 mt-6">
              <button
                type="button"
                onClick={() => setSelectedPlan(PLANS.MONTHLY)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  selectedPlan === PLANS.MONTHLY
                    ? "bg-[#0F1011] text-[#F7F8F8] shadow-sm border border-white/10"
                    : "text-[#8A8F98] hover:text-white"
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan(PLANS.YEARLY)}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  selectedPlan === PLANS.YEARLY
                    ? "bg-[#0F1011] text-[#F7F8F8] shadow-sm border border-white/10"
                    : "text-[#8A8F98] hover:text-white"
                }`}
              >
                <span>Annual billing</span>
                <span className="bg-[#4CC38A]/15 text-[#4CC38A] border border-[#4CC38A]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Monthly Card */}
            <Card
              className={`flex flex-col justify-between relative bg-[#0F1011]/90 backdrop-blur-xl transition-all duration-300 ${
                selectedPlan === PLANS.MONTHLY
                  ? "border-[#5E6AD2] shadow-[0_0_35px_rgba(94,106,210,0.22)]"
                  : "border-white/[0.08]"
              }`}
            >
              <CardHeader className="space-y-3 pt-7">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    {PLAN_DETAILS[PLANS.MONTHLY].name}
                  </CardTitle>
                  <span className="text-xs text-[#8A8F98]">1 Draw / Month</span>
                </div>
                <CardDescription>
                  {PLAN_DETAILS[PLANS.MONTHLY].description}
                </CardDescription>

                <div className="pt-2 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    $9.99
                  </span>
                  <span className="text-xs text-[#8A8F98]">/ month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <div className="p-2.5 rounded-[6px] bg-[#141516] border border-white/[0.06] text-xs text-[#8A8F98] flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-[#EB5757] shrink-0" />
                  <span>
                    Min. <strong>10% ($1.00/mo)</strong> directly to your charity
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#F7F8F8] pt-2">
                  {[
                    "1 Active 5-score draw ticket entered automatically every month",
                    "Customizable charity give-back (10% to 100%)",
                    "Continuous Stableford handicap calculation & score history",
                    "Eligible for 5-number monthly jackpot rollover prizes",
                    "Cancel or pause anytime with one click",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <DoodleCheck size={16} className="mt-0.5 text-[#4CC38A] shrink-0" />
                      <span className="text-[#8A8F98] leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  variant={selectedPlan === PLANS.MONTHLY ? "primary" : "secondary"}
                  size="lg"
                  className="w-full"
                  isLoading={isLoadingCheckout}
                  onClick={() => handleCheckout(PLANS.MONTHLY)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isCurrentActive && subscription.plan === PLANS.MONTHLY
                    ? "Current Active Plan"
                    : "Subscribe Monthly ($9.99/mo)"}
                </Button>
              </CardFooter>
            </Card>

            {/* Yearly Card (Featured) */}
            <Card
              className={`flex flex-col justify-between relative bg-[#0F1011]/90 backdrop-blur-xl transition-all duration-300 ${
                selectedPlan === PLANS.YEARLY
                  ? "border-[#5E6AD2] shadow-[0_0_40px_rgba(94,106,210,0.28)]"
                  : "border-white/[0.08]"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="accent" size="sm" withDot>
                  Best Value — Save 20%
                </Badge>
              </div>

              <CardHeader className="space-y-3 pt-7">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    {PLAN_DETAILS[PLANS.YEARLY].name}
                  </CardTitle>
                  <span className="text-xs text-[#8A8F98]">12 Draws / Year</span>
                </div>
                <CardDescription>
                  {PLAN_DETAILS[PLANS.YEARLY].description}
                </CardDescription>

                <div className="pt-2 flex items-baseline gap-1.5">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                    $7.99
                  </span>
                  <span className="text-xs text-[#8A8F98]">
                    / month ($95.88 billed annually)
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-2">
                <div className="p-2.5 rounded-[6px] bg-[#141516] border border-white/[0.06] text-xs text-[#8A8F98] flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-[#EB5757] shrink-0" />
                  <span>
                    Min. <strong>10% ($9.59/yr)</strong> directly to your charity
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-[#F7F8F8] pt-2">
                  {[
                    "12 Consecutive monthly jackpot draw entries (Full year)",
                    "20% Discount compared to monthly billing",
                    "Fast-track prize claim & scorecard verification",
                    "Customizable charity allocation percentage",
                    "Supporter badge on monthly public winners board",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <DoodleCheck size={16} className="mt-0.5 text-[#4CC38A] shrink-0" />
                      <span className="text-[#8A8F98] leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoadingCheckout}
                  onClick={() => handleCheckout(PLANS.YEARLY)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isCurrentActive && subscription.plan === PLANS.YEARLY
                    ? "Current Active Plan"
                    : "Subscribe Annual ($95.88/yr)"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Guarantee / Security Notice */}
          <div className="max-w-2xl mx-auto pt-6 text-center space-y-2 text-xs text-[#8A8F98]">
            <div className="flex items-center justify-center gap-4 text-white/70">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#5E6AD2]" />
                Secure Stripe Checkout
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#4CC38A]" />
                Cancel Anytime
              </span>
            </div>
            <p>
              Payments processed securely by Stripe in test mode. No commitments, cancel with one click from your billing portal.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

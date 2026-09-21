"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Trophy,
  Heart,
  CreditCard,
  Sparkles,
  Calendar,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { UserMenu } from "@/components/ui/UserMenu";
import { ScoreManager } from "@/components/dashboard/ScoreManager";
import { SparkleStar } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [charity, setCharity] = useState(null);
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Get current authenticated user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);

          // 2. Load profile
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, charity_id, charity_percent, stripe_customer_id")
            .eq("id", currentUser.id)
            .maybeSingle();

          setProfile(userProfile);

          // 3. Load active subscription
          const { data: userSub } = await supabase
            .from("subscriptions")
            .select("status, plan, current_period_end, cancel_at_period_end")
            .eq("user_id", currentUser.id)
            .eq("status", "active")
            .maybeSingle();

          setSubscription(userSub);

          // 4. Load chosen charity
          if (userProfile?.charity_id) {
            const { data: charityData } = await supabase
              .from("charities")
              .select("id, name, slug, description")
              .eq("id", userProfile.charity_id)
              .maybeSingle();

            setCharity(charityData);
          }

          // 5. Load latest scores for the draw snapshot numbers
          const { data: userScores } = await supabase
            .from("scores")
            .select("id, score, played_on")
            .eq("user_id", currentUser.id)
            .order("played_on", { ascending: false })
            .limit(5);

          setScores(userScores || []);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Could not open customer billing portal.");
        setIsLoadingPortal(false);
      }
    } catch {
      toast.error("Billing portal request failed.");
      setIsLoadingPortal(false);
    }
  };

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Golfer";
  const isSubscribed = subscription?.status === "active";
  const charityName = charity?.name || "Youth on Course";
  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] selection:bg-[#5E6AD2]/30 flex flex-col">
      {/* Top Ambient Radial Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[360px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, rgba(94, 106, 210, 0.16) 0%, rgba(8, 9, 10, 0) 100%)",
        }}
      />

      {/* Dashboard Top App-Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#08090A]/85 backdrop-blur-xl transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">Overview</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="text-xs text-[#8A8F98] hidden sm:inline">Golfer Console &amp; Monthly Draw</span>
          </div>

          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenPortal}
                isLoading={isLoadingPortal}
                className="hidden sm:flex text-xs h-8 px-3 border-white/10 hover:border-white/20 text-[#8A8F98] hover:text-white"
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
              >
                Billing
              </Button>
            ) : (
              <Link href="/pricing">
                <Button variant="primary" size="sm" className="text-xs h-8 px-3.5">
                  Upgrade Plan
                </Button>
              </Link>
            )}

            <UserMenu user={user} profile={profile} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-[12px] bg-[#0F1011]/85 border border-white/[0.08] relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-4 right-4 text-white/20 pointer-events-none hidden sm:block">
            <SparkleStar size={20} variant="8-point" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back, {fullName}
              </h1>
              {profile?.role === "admin" && (
                <Badge variant="accent" size="sm">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#8A8F98] flex items-center gap-2">
              <span>Beneficiary:</span>
              <span className="text-white font-medium flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#EB5757] fill-[#EB5757]/20" />
                {charityName} ({profile?.charity_percent || 10}% give-back)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isSubscribed ? (
              <div className="flex items-center gap-2 bg-[#4CC38A]/10 border border-[#4CC38A]/30 px-3.5 py-1.5 rounded-full text-xs text-[#4CC38A] font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {subscription.plan === "yearly" ? "Annual Champion" : "Monthly Golfer"} Active
                </span>
              </div>
            ) : (
              <Link href="/pricing">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Activate Draw Subscription
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Score Manager (Left) & Draw/Charity (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (7 cols): Rolling 5-Score Stableford Manager */}
          <div id="scores" className="lg:col-span-7 space-y-6 scroll-mt-20">
            <ScoreManager />
          </div>

          {/* Right Column (5 cols): Active Draw & Charity Impact */}
          <div className="lg:col-span-5 space-y-6">
            {/* Monthly Charity Draw Ticket Card */}
            <Card id="draw" className="bg-[#0F1011] border-white/[0.08] relative overflow-hidden shadow-xl scroll-mt-20">
              <div className="absolute top-0 right-0 w-48 h-28 bg-[#5E6AD2]/10 rounded-full blur-2xl pointer-events-none" />

              <CardHeader className="p-6 border-b border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#F2C94C]" />
                    <CardTitle className="text-base font-bold text-white">
                      {currentMonthName} Draw
                    </CardTitle>
                  </div>
                  <Badge variant="accent" size="sm">
                    40% Rollover
                  </Badge>
                </div>
                <CardDescription className="text-xs text-[#8A8F98]">
                  5-number jackpot draw matching your verified Stableford scores.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Prize Pool Highlight */}
                <div className="p-4 rounded-[8px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-[#8A8F98] font-semibold">
                      Estimated Prize Pool
                    </span>
                    <div className="text-2xl font-black tracking-tight text-white">
                      $12,450.00
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#4CC38A] bg-[#4CC38A]/10 border border-[#4CC38A]/30 px-2 py-0.5 rounded font-mono">
                      +40% Net Share
                    </span>
                  </div>
                </div>

                {/* Your Active Snapshot Numbers */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#8A8F98]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-[#5E6AD2]" />
                      <span>Your Active Draw Numbers</span>
                    </span>
                    <span>{scores.length} of 5 scores</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3 rounded-[8px] bg-[#141516] border border-white/10">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const scoreItem = scores[i];
                      return (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            scoreItem
                              ? "bg-gradient-to-br from-[#5E6AD2] to-[#4552B8] text-white shadow-[0_0_12px_rgba(94,106,210,0.4)]"
                              : "border border-dashed border-white/20 text-white/30"
                          }`}
                        >
                          {scoreItem ? scoreItem.score : "?"}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[#8A8F98]">
                    {scores.length === 5 ? (
                      <span className="text-[#4CC38A] font-medium">
                        ✓ Full 5-number ticket active for the end-of-month draw!
                      </span>
                    ) : (
                      <span>
                        Log <strong>{5 - scores.length} more round(s)</strong> in your score manager to complete your ticket.
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Beneficiary Charity Impact Card */}
            <Card id="charity" className="bg-[#0F1011] border-white/[0.08] relative overflow-hidden shadow-xl scroll-mt-20">
              <CardHeader className="p-6 border-b border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#EB5757]" />
                    <CardTitle className="text-base font-bold text-white">
                      Charity Impact
                    </CardTitle>
                  </div>
                  <span className="text-xs text-[#4CC38A] font-mono font-semibold">
                    10% Pledged
                  </span>
                </div>
                <CardDescription className="text-xs text-[#8A8F98]">
                  Partner charity funded through your golfer subscription.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-[8px] bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <h4 className="text-sm font-semibold text-white flex items-center justify-between">
                    <span>{charityName}</span>
                    <Badge variant="secondary" size="sm">
                      Active Beneficiary
                    </Badge>
                  </h4>
                  <p className="text-xs text-[#8A8F98] leading-relaxed">
                    {charity?.description ||
                      "Subsidizing youth golf rounds, providing adaptive instruction, and expanding fairway stewardship."}
                  </p>
                </div>

                <div className="text-center pt-1">
                  <Link
                    href="/complete-profile"
                    className="text-xs text-[#8A95FF] hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Change designated charity</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

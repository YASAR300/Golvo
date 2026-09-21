"use client";

import { useState, useEffect, useMemo } from "react";
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
  Clock,
  Lock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ScoreManager } from "@/components/dashboard/ScoreManager";
import { CharitySettingsModal } from "@/components/dashboard/CharitySettingsModal";
import { SparkleStar } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";

// Pure SVG Tiny Sparkline Chart
function Sparkline({ data = [20, 24, 28, 25, 32, 36, 38], color = "#5E6AD2" }) {
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const width = 80;
  const height = 24;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / (max - min)) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Skeleton Loading Placeholder
function DashboardSkeleton() {
  return (
    <div className="p-6 sm:p-8 space-y-8 animate-pulse">
      <div className="h-28 rounded-[12px] bg-white/[0.03] border border-white/[0.06]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-[10px] bg-white/[0.03] border border-white/[0.06]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 h-96 rounded-[12px] bg-white/[0.03] border border-white/[0.06]" />
        <div className="lg:col-span-5 h-96 rounded-[12px] bg-white/[0.03] border border-white/[0.06]" />
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [charity, setCharity] = useState(null);
  const [scores, setScores] = useState([]);
  const [winnings, setWinnings] = useState([]);
  const [drawsCount, setDrawsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isCharityModalOpen, setIsCharityModalOpen] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [highlightedSection, setHighlightedSection] = useState(null);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (currentUser) {
        setUser(currentUser);

        // 1. Load Profile
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, charity_id, charity_percent, stripe_customer_id")
          .eq("id", currentUser.id)
          .maybeSingle();
        setProfile(userProfile);

        // 2. Load Subscription with Automatic Stripe Session Sync Fallback
        let userSub = null;

        // Check if redirected from Stripe Checkout with session_id
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const sessionId = urlParams.get("session_id");
          const isCheckoutSuccess = urlParams.get("checkout") === "success";

          if (sessionId || isCheckoutSuccess) {
            try {
              const syncRes = await fetch("/api/stripe/sync-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: sessionId || undefined }),
              });
              const syncData = await syncRes.json();
              if (syncRes.ok && syncData.subscription) {
                userSub = syncData.subscription;
                toast.success("Subscription activated successfully! Welcome to Golvo.", {
                  id: "sub-success",
                });
                window.dispatchEvent(new Event("golvo:subscription_updated"));
                window.history.replaceState(null, "", window.location.pathname);
              }
            } catch (e) {
              console.warn("Session sync notice:", e);
            }
          }
        }

        // If not synced from URL parameter, query Supabase subscriptions
        if (!userSub) {
          const { data: dbSub } = await supabase
            .from("subscriptions")
            .select("status, plan, current_period_end, cancel_at_period_end")
            .eq("user_id", currentUser.id)
            .eq("status", "active")
            .maybeSingle();

          userSub = dbSub;

          // If still no active subscription found in Supabase, run background sync check with Stripe
          if (!userSub) {
            try {
              const bgRes = await fetch("/api/stripe/sync-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              if (bgRes.ok) {
                const bgData = await bgRes.json();
                if (bgData.subscription?.status === "active") {
                  userSub = bgData.subscription;
                  window.dispatchEvent(new Event("golvo:subscription_updated"));
                }
              }
            } catch {}
          }
        }

        setSubscription(userSub);

        // 3. Load Charity
        if (userProfile?.charity_id) {
          const { data: ch } = await supabase
            .from("charities")
            .select("id, name, slug, description")
            .eq("id", userProfile.charity_id)
            .maybeSingle();
          setCharity(ch);
        }

        // 4. Load Scores
        const { data: userScores } = await supabase
          .from("scores")
          .select("id, score, played_on")
          .eq("user_id", currentUser.id)
          .order("played_on", { ascending: false })
          .limit(5);
        setScores(userScores || []);

        // 5. Load Winnings
        const { data: userWinnings } = await supabase
          .from("winners")
          .select("id, prize_cents, verification_status, payment_status, created_at")
          .eq("user_id", currentUser.id);
        setWinnings(userWinnings || []);

        // 6. Load Draws participation count
        const { count: entriesCount } = await supabase
          .from("draw_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUser.id);
        setDrawsCount(entriesCount || 0);
      }
    } catch (err) {
      console.warn("Dashboard data error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleSubUpdated = () => {
      loadDashboardData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("golvo:subscription_updated", handleSubUpdated);
      return () => window.removeEventListener("golvo:subscription_updated", handleSubUpdated);
    }
  }, []);

  // Hash change and smooth scroll with glowing focus outline
  useEffect(() => {
    function handleHash() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const targetId = hash === "draws" ? "draw" : hash;
        setHighlightedSection(targetId);

        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        const timer = setTimeout(() => {
          setHighlightedSection(null);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // End of month countdown timer
  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const diffMs = Math.max(0, endOfMonth - now);

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

      setCountdown({ days, hours, minutes });
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000);
    return () => clearInterval(timer);
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

  const isSubscribed = subscription?.status === "active";
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Golfer";
  const charityName = charity?.name || "Youth on Course";
  const charityPercent = profile?.charity_percent || 10;

  // Stats calculation
  const totalWinningsCents = useMemo(() => {
    return winnings.reduce((acc, w) => acc + (w.prize_cents || 0), 0);
  }, [winnings]);

  const scoreAverage = useMemo(() => {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, s) => acc + s.score, 0);
    return (sum / scores.length).toFixed(1);
  }, [scores]);

  const renewalDateString = useMemo(() => {
    if (!subscription?.current_period_end) return null;
    return new Date(subscription.current_period_end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [subscription]);

  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* 1. Subscription & Welcome Header Card */}
      <div
        id="subscription"
        className={`p-6 sm:p-7 rounded-[12px] bg-[#0F1011] border border-white/[0.08] relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl scroll-mt-24 transition-all duration-500 ${
          highlightedSection === "subscription"
            ? "ring-2 ring-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.35)]"
            : ""
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
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
            <span>Designated Charity:</span>
            <button
              type="button"
              onClick={() => setIsCharityModalOpen(true)}
              className="text-white font-medium hover:text-[#FF8585] flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <Heart className="w-3.5 h-3.5 text-[#EB5757] fill-[#EB5757]/20 group-hover:scale-110 transition-transform" />
              <span>{charityName} ({charityPercent}% give-back)</span>
              <span className="text-[10px] text-[#8A8F98] underline ml-1">edit</span>
            </button>
          </p>
        </div>

        {/* Subscription Status Pill & Action */}
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] p-2 pr-3 rounded-[10px]">
              <div className="flex items-center gap-2 text-xs text-[#4CC38A] font-medium px-2 py-1 rounded bg-[#4CC38A]/10 border border-[#4CC38A]/25">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {subscription.plan === "yearly" ? "Annual Champion" : "Monthly Golfer"}
                </span>
              </div>
              {renewalDateString && (
                <span className="text-[11px] text-[#8A8F98] hidden sm:inline">
                  Renews {renewalDateString}
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenPortal}
                isLoading={isLoadingPortal}
                className="text-xs h-7 px-2.5 border-white/10 hover:border-white/20 text-[#8A8F98] hover:text-white"
                leftIcon={<CreditCard className="w-3 h-3" />}
              >
                Manage
              </Button>
            </div>
          ) : (
            <Link href="/pricing">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Activate Subscription
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Non-Subscriber Persuasive Upgrade Banner (if not subscribed) */}
      {!isSubscribed && (
        <div className="p-6 rounded-[12px] bg-gradient-to-r from-[#5E6AD2]/15 via-[#5E6AD2]/5 to-transparent border border-[#5E6AD2]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#8A95FF] text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Full Access Locked — Free Preview Active</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Unlock Verified Handicap Tracking &amp; Monthly Charity Jackpot Draws
            </h3>
            <p className="text-xs text-[#8A8F98]">
              Subscribe today: 10%+ funds {charityName}, 40% funds the monthly jackpot pot, and your 5 scores enter the draw.
            </p>
          </div>

          <Link href="/pricing">
            <Button variant="primary" size="md" className="shrink-0 bg-[#5E6AD2] hover:bg-[#6875E8]">
              Upgrade to Enter Monthly Draw
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Stat Tiles with Pure SVG Sparklines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Stableford Average */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8A8F98] font-semibold">
              Avg. Stableford
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {scoreAverage > 0 ? `${scoreAverage} pts` : "—"}
            </div>
          </div>
          <Sparkline data={scores.length > 0 ? scores.map((s) => s.score).reverse() : [25, 28, 32, 34, 36]} color="#5E6AD2" />
        </div>

        {/* Stat 2: Active Draw Pot */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8A8F98] font-semibold">
              Estimated Pot
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#F2C94C]">
              $12,450
            </div>
          </div>
          <Sparkline data={[8000, 9200, 10400, 11500, 12450]} color="#F2C94C" />
        </div>

        {/* Stat 3: Draws Participated */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8A8F98] font-semibold">
              Draws Entered
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {drawsCount}
            </div>
          </div>
          <Sparkline data={[1, 1, 2, 2, 3, drawsCount || 1]} color="#4CC38A" />
        </div>

        {/* Stat 4: Total Winnings */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-[#8A8F98] font-semibold">
              Total Won
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#4CC38A]">
              ${(totalWinningsCents / 100).toFixed(2)}
            </div>
          </div>
          <Sparkline data={[0, 0, 100, 250, totalWinningsCents || 500]} color="#4CC38A" />
        </div>
      </div>

      {/* 3. 2-Column Main Layout: Score Manager (Left) & Draw/Charity/Winnings (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Score Entry & Edit Manager */}
        <div
          id="scores"
          className={`lg:col-span-7 space-y-6 scroll-mt-24 transition-all duration-500 rounded-[12px] ${
            highlightedSection === "scores"
              ? "ring-2 ring-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.35)]"
              : ""
          }`}
        >
          <ScoreManager />
        </div>

        {/* Right Column (5 cols): Draw Participation, Charity, & Winnings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Monthly Charity Draw Card with End-of-Month Countdown */}
          <Card
            id="draw"
            className={`bg-[#0F1011] border-white/[0.08] relative overflow-hidden shadow-xl scroll-mt-24 transition-all duration-500 ${
              highlightedSection === "draw" || highlightedSection === "draws"
                ? "ring-2 ring-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.35)]"
                : ""
            }`}
          >
            <CardHeader className="p-6 border-b border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#F2C94C]" />
                  <CardTitle className="text-base font-bold text-white">
                    {currentMonthName} Draw
                  </CardTitle>
                </div>
                {/* Subtle Doodle 1: SparkleStar near draw title */}
                <div className="flex items-center gap-1.5 text-white/30">
                  <SparkleStar size={16} variant="4-point" />
                  <Badge variant="accent" size="sm">
                    40% Rollover
                  </Badge>
                </div>
              </div>

              {/* Draw Countdown Clock */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-[8px] bg-white/[0.02] border border-white/[0.06] text-xs">
                <span className="text-[#8A8F98] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5E6AD2]" />
                  Draw closes in:
                </span>
                <span className="font-mono font-bold text-white tracking-wider">
                  {countdown.days}d {countdown.hours}h {countdown.minutes}m
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Active Ticket Spheres */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#8A8F98]">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-[#5E6AD2]" />
                    <span>Your Active 5-Score Draw Numbers</span>
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

                {scores.length < 5 && (
                  /* Subtle Doodle 2: Hand-annotated Caveat style note in empty state */
                  <p className="text-[12px] text-[#F2C94C] italic font-serif">
                    ✎ Tip: Log {5 - scores.length} more round(s) in your score manager to complete your 5-number draw ticket!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Charity Impact Card with Slider Trigger */}
          <Card
            id="charity"
            className={`bg-[#0F1011] border-white/[0.08] relative overflow-hidden shadow-xl scroll-mt-24 transition-all duration-500 ${
              highlightedSection === "charity"
                ? "ring-2 ring-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.35)]"
                : ""
            }`}
          >
            <CardHeader className="p-6 border-b border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#EB5757]" />
                  <CardTitle className="text-base font-bold text-white">
                    Charity Give-Back
                  </CardTitle>
                </div>
                <span className="text-xs text-[#FF8585] font-mono font-semibold bg-[#EB5757]/10 border border-[#EB5757]/20 px-2 py-0.5 rounded-full">
                  {charityPercent}% Pledged
                </span>
              </div>
              <CardDescription className="text-xs text-[#8A8F98]">
                Every invoice transfers {charityPercent}% directly to your designated partner charity.
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
                <button
                  type="button"
                  onClick={() => setIsCharityModalOpen(true)}
                  className="text-xs text-[#8A95FF] hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Change charity &amp; contribution %</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Winnings Overview Widget */}
          <Card
            id="winnings"
            className={`bg-[#0F1011] border-white/[0.08] p-6 space-y-4 scroll-mt-24 transition-all duration-500 ${
              highlightedSection === "winnings"
                ? "ring-2 ring-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.35)]"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#4CC38A]" />
                <h3 className="text-sm font-bold text-white">Prize Winnings Summary</h3>
              </div>
              <Link
                href="/winnings"
                className="text-xs text-[#8A95FF] hover:text-white flex items-center gap-1"
              >
                <span>View Winnings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {winnings.length === 0 ? (
              <p className="text-xs text-[#8A8F98]">
                No winning records yet. Match 3, 4, or 5 numbers in the monthly draw to win jackpot shares!
              </p>
            ) : (
              <div className="space-y-2.5">
                {winnings.slice(0, 3).map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-[8px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">
                        ${(w.prize_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-[#8A8F98] ml-2 font-mono">({w.tier})</span>
                    </div>
                    <Badge
                      variant={
                        w.payment_status === "paid"
                          ? "success"
                          : w.verification_status === "approved"
                          ? "accent"
                          : "secondary"
                      }
                      size="sm"
                    >
                      {w.payment_status === "paid" ? "Paid" : w.verification_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Charity Give-Back Settings Modal */}
      <CharitySettingsModal
        isOpen={isCharityModalOpen}
        onClose={() => setIsCharityModalOpen(false)}
        onUpdated={loadDashboardData}
      />
    </div>
  );
}

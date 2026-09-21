"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, ArrowLeft, Ticket, Clock, Sparkles, CheckCircle2, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function DashboardDrawsPage() {
  const [pastDraws, setPastDraws] = useState([]);
  const [userScores, setUserScores] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    async function loadDraws() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user) {
          // 1. Load active subscription
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("status, plan")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();
          setSubscription(sub);

          // 2. Load latest 5 scores
          const { data: scores } = await supabase
            .from("scores")
            .select("score, played_on")
            .eq("user_id", user.id)
            .order("played_on", { ascending: false })
            .limit(5);
          setUserScores(scores || []);

          // 3. Load published draws
          const { data: draws } = await supabase
            .from("draws")
            .select("id, month, winning_numbers, prize_pool_cents, jackpot_rollover_cents, published_at")
            .eq("status", "published")
            .order("month", { ascending: false });
          setPastDraws(draws || []);
        }
      } catch (err) {
        console.warn("Failed to load draws:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDraws();
  }, []);

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

  const isSubscribed = subscription?.status === "active";
  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-[12px] bg-[#0F1011] border border-white/[0.08] relative overflow-hidden backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-[#8A8F98] hover:text-white transition-colors p-1 -ml-1 rounded hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Monthly Charity Draws
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8F98]">
            5-number jackpot draws matching your verified Stableford rounds with 40% rollover prize pools.
          </p>
        </div>

        <Badge variant="accent" size="sm" withDot>
          End-of-Month Schedule
        </Badge>
      </div>

      {/* Active Draw Ticket Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col (7 cols): Active Draw & Countdown */}
        <Card className="lg:col-span-7 bg-[#0F1011] border-white/[0.08] p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F2C94C]" />
                <span>{currentMonthName} Jackpot Draw</span>
              </h2>
              <span className="text-xs text-[#8A8F98]">Draw execution: Final day of each calendar month</span>
            </div>

            <div className="text-right">
              <span className="text-xs text-[#8A8F98] block">Estimated Pot</span>
              <span className="text-xl sm:text-2xl font-black text-[#F2C94C]">$12,450.00</span>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="p-4 rounded-[10px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#8A8F98]">
              <Clock className="w-4 h-4 text-[#5E6AD2]" />
              <span>Draw closes in:</span>
            </div>
            <div className="font-mono font-bold text-sm sm:text-base text-white tracking-widest">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </div>
          </div>

          {/* User Active Numbers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8A8F98]">
              <span className="text-white font-semibold flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#5E6AD2]" />
                <span>Your Active 5-Number Snapshot</span>
              </span>
              <span>{userScores.length} of 5 scores recorded</span>
            </div>

            <div className="flex items-center justify-between gap-2 p-4 rounded-[10px] bg-[#141516] border border-white/10">
              {[0, 1, 2, 3, 4].map((idx) => {
                const scoreItem = userScores[idx];
                return (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base transition-all ${
                      scoreItem
                        ? "bg-gradient-to-br from-[#5E6AD2] to-[#4552B8] text-white shadow-[0_0_16px_rgba(94,106,210,0.5)]"
                        : "border border-dashed border-white/20 text-white/30"
                    }`}
                  >
                    {scoreItem ? scoreItem.score : "?"}
                  </div>
                );
              })}
            </div>

            {userScores.length === 5 ? (
              <p className="text-xs text-[#4CC38A] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ticket locked and automatically entered into the {currentMonthName} draw!</span>
              </p>
            ) : (
              <p className="text-xs text-[#F2C94C]">
                ⚠️ You need {5 - userScores.length} more score(s) in your score manager to complete your 5-number ticket.
              </p>
            )}
          </div>
        </Card>

        {/* Right Col (5 cols): Prize Distribution Info */}
        <Card className="lg:col-span-5 bg-[#0F1011] border-white/[0.08] p-6 sm:p-7 space-y-4">
          <h3 className="text-base font-bold text-white">Prize Tier Breakdown</h3>
          <p className="text-xs text-[#8A8F98] leading-relaxed">
            Every ticket matches your 5 Stableford scores against the 5 winning numbers drawn at month-end.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-[8px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white">Tier 1: Match 5 (Jackpot)</span>
                <p className="text-[11px] text-[#8A8F98]">40% of pool + Rollover from previous draw</p>
              </div>
              <span className="font-bold text-[#F2C94C]">40%</span>
            </div>

            <div className="p-3.5 rounded-[8px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white">Tier 2: Match 4</span>
                <p className="text-[11px] text-[#8A8F98]">35% of pool split equally among winners</p>
              </div>
              <span className="font-bold text-[#4CC38A]">35%</span>
            </div>

            <div className="p-3.5 rounded-[8px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white">Tier 3: Match 3</span>
                <p className="text-[11px] text-[#8A8F98]">25% of pool split equally among winners</p>
              </div>
              <span className="font-bold text-[#8A95FF]">25%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Past Published Draws Table */}
      <Card className="bg-[#0F1011] border-white/[0.08] p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Past Published Draws</h3>

        {pastDraws.length === 0 ? (
          <p className="text-xs text-[#8A8F98] py-4">
            No past draws published yet. Results will be published here at the end of every monthly cycle!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#8A8F98]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#F7F8F8]">
                  <th className="pb-3 font-semibold">Draw Month</th>
                  <th className="pb-3 font-semibold">Winning Numbers</th>
                  <th className="pb-3 font-semibold">Prize Pool</th>
                  <th className="pb-3 font-semibold">Jackpot Rollover</th>
                  <th className="pb-3 font-semibold text-right">Published At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pastDraws.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-medium text-white">{d.month}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {(d.winning_numbers || []).map((num, i) => (
                          <span
                            key={i}
                            className="w-6 h-6 rounded-full bg-[#5E6AD2]/20 border border-[#5E6AD2]/40 text-[#8A95FF] flex items-center justify-center font-bold text-[11px]"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-white">
                      ${((d.prize_pool_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 font-mono text-[#F2C94C]">
                      ${((d.jackpot_rollover_cents || 0) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-[#8A8F98]">
                      {d.published_at ? new Date(d.published_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

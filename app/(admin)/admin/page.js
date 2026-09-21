"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Heart,
  Ticket,
  Trophy,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadMetrics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        throw new Error(`Failed to load analytics: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  const metrics = data?.metrics || {
    total_users: 0,
    active_subscribers: 0,
    total_donations_cents: 0,
    total_prize_pool_cents: 0,
    total_paid_prizes_cents: 0,
    total_draws: 0,
  };

  const draws = data?.draws || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Overview & Platform Reports
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live System
            </span>
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Real-time subscriber metrics, prize allocations, charity distributions, and draw statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs text-[#8A8F98] hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* KPI Metric Tiles with Pure SVG Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl bg-[#0F1011] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8F98] font-medium">Registered Golfer Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {loading ? "..." : metrics.total_users}
              </div>
              <div className="text-[10px] text-[#8A8F98] mt-0.5">Platform members</div>
            </div>
            {/* SVG Sparkline */}
            <svg className="w-16 h-8 text-blue-400" viewBox="0 0 64 32" fill="none">
              <path
                d="M 2 26 L 14 22 L 28 24 L 40 12 L 52 14 L 62 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="p-4 rounded-xl bg-[#0F1011] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8F98] font-medium">Active Subscribers</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {loading ? "..." : metrics.active_subscribers}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">Monthly draw eligible</div>
            </div>
            {/* SVG Sparkline */}
            <svg className="w-16 h-8 text-emerald-400" viewBox="0 0 64 32" fill="none">
              <path
                d="M 2 28 L 14 25 L 26 18 L 38 16 L 50 8 L 62 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Total Charity Contributions */}
        <div className="p-4 rounded-xl bg-[#0F1011] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8F98] font-medium">Charity Impact Delivered</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {loading ? "..." : formatCurrency(metrics.total_donations_cents)}
              </div>
              <div className="text-[10px] text-rose-400/80 mt-0.5">To non-profit partners</div>
            </div>
            {/* SVG Sparkline */}
            <svg className="w-16 h-8 text-rose-400" viewBox="0 0 64 32" fill="none">
              <path
                d="M 2 24 L 14 20 L 26 22 L 38 12 L 50 10 L 62 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Total Prize Pool */}
        <div className="p-4 rounded-xl bg-[#0F1011] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8F98] font-medium">Total Prize Pools Generated</span>
            <div className="w-7 h-7 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#8590EA]">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight text-white">
                {loading ? "..." : formatCurrency(metrics.total_prize_pool_cents)}
              </div>
              <div className="text-[10px] text-[#8590EA] mt-0.5">Across all scheduled draws</div>
            </div>
            {/* SVG Sparkline */}
            <svg className="w-16 h-8 text-[#5E6AD2]" viewBox="0 0 64 32" fill="none">
              <path
                d="M 2 28 L 16 20 L 30 14 L 44 16 L 56 6 L 62 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* SVG Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Draw Pools Comparison Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0F1011] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Monthly Prize Pool History</h2>
              <p className="text-[11px] text-[#8A8F98] mt-0.5">
                Breakdown of total jackpot pool and rollover volume per draw cycle.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#8A8F98]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#5E6AD2]" />
                <span>Base Pool</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4CC38A]" />
                <span>Jackpot Rollover</span>
              </div>
            </div>
          </div>

          {/* Pure SVG Bar Chart */}
          <div className="h-48 w-full flex items-end pt-6 pb-2 px-2 border-b border-white/[0.08]">
            {draws.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center">
                <p className="text-xs text-[#8A8F98]">No historical draw records recorded yet.</p>
                <Link
                  href="/admin/draws"
                  className="mt-2 text-xs text-[#8590EA] hover:underline"
                >
                  Configure and simulate first draw →
                </Link>
              </div>
            ) : (
              <div className="w-full h-full flex items-end justify-between gap-4">
                {draws.slice(0, 6).map((d, i) => {
                  const maxPool = Math.max(...draws.map((item) => (item.prize_pool_cents || 1) + (item.jackpot_rollover_cents || 0)), 10000);
                  const poolHeight = Math.max(12, Math.round(((d.prize_pool_cents || 0) / maxPool) * 120));
                  const rollHeight = Math.max(4, Math.round(((d.jackpot_rollover_cents || 0) / maxPool) * 120));

                  return (
                    <div key={d.id || i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-36">
                        <div
                          style={{ height: `${poolHeight}px` }}
                          className="w-4 rounded-t bg-[#5E6AD2] hover:bg-[#727EE5] transition-all relative group-hover:scale-y-105"
                          title={`Base: ${formatCurrency(d.prize_pool_cents || 0)}`}
                        />
                        <div
                          style={{ height: `${rollHeight}px` }}
                          className="w-4 rounded-t bg-[#4CC38A] hover:bg-[#5ED499] transition-all relative group-hover:scale-y-105"
                          title={`Rollover: ${formatCurrency(d.jackpot_rollover_cents || 0)}`}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#8A8F98] group-hover:text-white transition-colors">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Admin Navigation & Health Cards */}
        <div className="p-5 rounded-xl bg-[#0F1011] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Operations Shortcut</h2>
            <p className="text-[11px] text-[#8A8F98] mt-0.5">
              Jump directly to specific platform management sections.
            </p>
          </div>

          <div className="space-y-2">
            <Link
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
                <div>
                  <div className="text-xs font-medium text-white">User Directory</div>
                  <div className="text-[10px] text-[#8A8F98]">Search golfers & edit scores</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/admin/draws"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
                <div>
                  <div className="text-xs font-medium text-white">Monthly Draw Engine</div>
                  <div className="text-[10px] text-[#8A8F98]">Simulate and publish results</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/admin/charities"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
                <div>
                  <div className="text-xs font-medium text-white">Charity Partners</div>
                  <div className="text-[10px] text-[#8A8F98]">Add charities & upload media</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/admin/winners"
              className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
                <div>
                  <div className="text-xs font-medium text-white">Winner Claims</div>
                  <div className="text-[10px] text-[#8A8F98]">Verify scorecard proof & payout</div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#8A8F98] group-hover:text-white transition-colors" />
            </Link>
          </div>

          <div className="p-3 rounded-lg bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#8590EA] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8590EA] leading-relaxed">
              All administrative operations enforce server-side role validation. Score changes and draw publications take effect immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Ticket,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation form
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonthStr);
  const [mode, setMode] = useState("random");
  const [weighting, setWeighting] = useState("most-frequent");
  const [simulating, setSimulating] = useState(false);

  // Active or selected simulation preview
  const [simulationResult, setSimulationResult] = useState(null);
  const [publishing, setPublishing] = useState(false);

  async function fetchDraws() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/draws");
      if (!res.ok) throw new Error("Failed to load draw history");
      const data = await res.json();
      setDraws(data.draws || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDraws();
  }, []);

  async function handleRunSimulation() {
    setSimulating(true);
    try {
      const res = await fetch("/api/admin/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          mode,
          options: mode === "algorithmic" ? { weighting } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Simulation failed");
      }

      toast.success(data.message || "Simulation generated successfully");
      setSimulationResult(data);
      fetchDraws();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSimulating(false);
    }
  }

  async function handlePublishDraw(drawId) {
    if (!confirm("Are you sure you want to officially publish this draw? This will notify winners and lock results.")) {
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/draws/${drawId}/publish`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Publish failed");
      }

      toast.success(data.message || "Draw officially published!");
      if (simulationResult?.draw?.id === drawId) {
        setSimulationResult((prev) => ({
          ...prev,
          draw: { ...prev.draw, status: "published" },
        }));
      }
      fetchDraws();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Monthly Draw Engine
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Configure draw algorithm modes, simulate outcomes, preview prize pools, and publish official monthly results.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDraws}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs text-[#8A8F98] hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Simulation Configuration Card */}
      <div className="p-6 rounded-xl bg-[#0F1011] border border-white/[0.08] space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5E6AD2]" />
              Draw Generator & Simulation
            </h2>
            <p className="text-xs text-[#8A8F98] mt-0.5">
              Simulations can be re-run safely before publishing to inspect winning entries and tier distributions.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#8A8F98] border border-white/[0.08]">
            Automated Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Month Input */}
          <div>
            <label className="block text-xs text-[#8A8F98] font-medium mb-1.5">
              Draw Month (YYYY-MM)
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-[#08090A] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs text-[#8A8F98] font-medium mb-1.5">
              Generation Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-[#08090A] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
            >
              <option value="random">Pure Random (1–45)</option>
              <option value="algorithmic">Algorithmic (Score Weighted)</option>
            </select>
          </div>

          {/* Algorithmic Weighting */}
          <div>
            <label className="block text-xs text-[#8A8F98] font-medium mb-1.5">
              Weighting Strategy
            </label>
            <select
              value={weighting}
              disabled={mode !== "algorithmic"}
              onChange={(e) => setWeighting(e.target.value)}
              className="w-full px-3 py-2 bg-[#08090A] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#5E6AD2] disabled:opacity-40"
            >
              <option value="most-frequent">Most Frequent Subscriber Scores</option>
              <option value="least-frequent">Least Frequent (High Entropy)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={simulating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-lg shadow-[#5E6AD2]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{simulating ? "Evaluating Subscriber Entries..." : "Run Simulation Preview"}</span>
          </button>
        </div>
      </div>

      {/* Simulation Result Preview (if generated) */}
      {simulationResult && (
        <div className="p-6 rounded-xl bg-[#0F1011] border border-[#5E6AD2]/30 space-y-6 animate-fade-in relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#5E6AD2]/20 text-[#8590EA] border border-[#5E6AD2]/40 font-semibold">
                  Simulation Preview
                </span>
                <span className="text-xs text-[#8A8F98] font-mono">
                  Cycle: {simulationResult.draw?.month}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mt-1">
                Generated Winning Combination & Prize Breakdown
              </h3>
            </div>

            {simulationResult.draw?.status === "simulated" && (
              <button
                type="button"
                onClick={() => handlePublishDraw(simulationResult.draw.id)}
                disabled={publishing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{publishing ? "Publishing..." : "Publish Official Draw"}</span>
              </button>
            )}
          </div>

          {/* 5 Winning Number Balls */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-[#08090A] border border-white/[0.06]">
            <span className="text-xs text-[#8A8F98] font-medium">Drawn Numbers:</span>
            <div className="flex items-center gap-3">
              {simulationResult.draw?.winning_numbers?.map((num, i) => (
                <div
                  key={i}
                  className="w-11 h-11 rounded-full bg-gradient-to-b from-white to-gray-200 text-[#08090A] font-bold text-base flex items-center justify-center shadow-md shadow-white/10"
                >
                  {num}
                </div>
              ))}
            </div>
            <span className="text-xs text-[#8A8F98] sm:ml-auto font-mono">
              Mode: <strong className="text-white capitalize">{simulationResult.draw?.mode}</strong>
            </span>
          </div>

          {/* Pool & Rollover Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-[#8A8F98]">Total Prize Pool</span>
              <div className="text-lg font-bold text-white mt-1">
                {formatCurrency(simulationResult.draw?.prize_pool_cents || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-[#8A8F98]">Jackpot Rollover In</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {formatCurrency(simulationResult.draw?.jackpot_rollover_cents || 0)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-[#8A8F98]">Active Entries Evaluated</span>
              <div className="text-lg font-bold text-white mt-1">
                {simulationResult.entries?.length || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-[#8A8F98]">Total Prize Winners</span>
              <div className="text-lg font-bold text-[#8590EA] mt-1">
                {simulationResult.winners?.length || 0}
              </div>
            </div>
          </div>

          {/* Tier Breakdown Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Tier Winners Preview
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#08090A] border border-white/[0.06]">
                <div className="flex justify-between items-center text-[#8A8F98]">
                  <span>Match 5 (Jackpot - 40%)</span>
                  <span className="font-mono text-white">
                    {simulationResult.winners?.filter((w) => w.tier === "match5").length || 0} winners
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08090A] border border-white/[0.06]">
                <div className="flex justify-between items-center text-[#8A8F98]">
                  <span>Match 4 (Tier 2 - 35%)</span>
                  <span className="font-mono text-white">
                    {simulationResult.winners?.filter((w) => w.tier === "match4").length || 0} winners
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#08090A] border border-white/[0.06]">
                <div className="flex justify-between items-center text-[#8A8F98]">
                  <span>Match 3 (Tier 3 - 25%)</span>
                  <span className="font-mono text-white">
                    {simulationResult.winners?.filter((w) => w.tier === "match3").length || 0} winners
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draws History Table */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Draws History & Status</h2>

        <div className="rounded-xl border border-white/[0.08] bg-[#0F1011] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8A8F98] font-medium">
                  <th className="py-3 px-4">Cycle Month</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Winning Numbers</th>
                  <th className="py-3 px-4">Prize Pool</th>
                  <th className="py-3 px-4">Jackpot Rollover</th>
                  <th className="py-3 px-4">Published At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#8A8F98]">
                      <div className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
                      <div>Loading draws history...</div>
                    </td>
                  </tr>
                ) : draws.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-[#8A8F98]">
                      No draws generated yet. Run your first simulation above.
                    </td>
                  </tr>
                ) : (
                  draws.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">
                        {d.month}
                      </td>

                      <td className="py-3 px-4">
                        {d.status === "published" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Published
                          </span>
                        ) : d.status === "simulated" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Simulated (Draft)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[#8A8F98] border border-white/[0.08]">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 capitalize text-[#8A8F98]">
                        {d.mode}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {d.winning_numbers?.length ? (
                          <div className="flex items-center gap-1">
                            {d.winning_numbers.map((n, i) => (
                              <span
                                key={i}
                                className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-semibold"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#8A8F98]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-white">
                        {formatCurrency(d.prize_pool_cents || 0)}
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {formatCurrency(d.jackpot_rollover_cents || 0)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[#8A8F98]">
                        {d.published_at
                          ? new Date(d.published_at).toLocaleDateString()
                          : "Unpublished"}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {d.status === "simulated" && (
                          <button
                            type="button"
                            onClick={() => handlePublishDraw(d.id)}
                            disabled={publishing}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                          >
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

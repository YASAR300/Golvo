"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Trophy,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertTriangle,
  X,
  FileCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Review Modal state
  const [inspectingWinner, setInspectingWinner] = useState(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  async function fetchWinners() {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/admin/winners"
          : `/api/admin/winners?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load winners list");
      const data = await res.json();
      setWinners(data.winners || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWinners();
  }, [statusFilter]);

  async function openInspectModal(winner) {
    setInspectingWinner(winner);
    setSignedUrl(null);
    setRejectionReason("");
    setLoadingSignedUrl(true);

    try {
      const res = await fetch(`/api/admin/winners/${winner.id}/review`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load proof URL");
      }
      const data = await res.json();
      setSignedUrl(data.signedUrl);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingSignedUrl(false);
    }
  }

  async function handleReviewAction(action) {
    if (!inspectingWinner) return;

    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting the proof scorecard");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/winners/${inspectingWinner.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejection_reason: rejectionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      toast.success(
        action === "approve"
          ? "Winner proof verified and approved!"
          : "Scorecard proof rejected"
      );
      setInspectingWinner(null);
      fetchWinners();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleMarkPaid(winnerId) {
    if (!confirm("Confirm marking this prize payout as completed via Stripe / Bank Transfer?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/winners/${winnerId}/pay`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payout");

      toast.success("Prize marked as paid!");
      fetchWinners();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Winner Verification & Payouts
            <span className="text-xs font-mono text-[#8A8F98]">
              ({winners.length} claims)
            </span>
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Audit submitted signed golf scorecards via secure signed URLs, approve claims, and disburse prize payouts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchWinners}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs text-[#8A8F98] hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs / Select */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Claims" },
          { id: "submitted", label: "Pending Review" },
          { id: "approved", label: "Approved" },
          { id: "pending_proof", label: "Awaiting Proof" },
          { id: "rejected", label: "Rejected" },
          { id: "paid", label: "Paid" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.id
                ? "bg-white/[0.12] text-white border border-white/20 shadow-sm"
                : "bg-[#0F1011] text-[#8A8F98] hover:text-white border border-white/[0.06]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Winners Table */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0F1011] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8A8F98] font-medium">
                <th className="py-3 px-4">Golfer</th>
                <th className="py-3 px-4">Draw Cycle</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Prize Pool Share</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8A8F98]">
                    <div className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
                    <div>Loading winner claims...</div>
                  </td>
                </tr>
              ) : winners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8A8F98]">
                    No winner records found for the selected filter.
                  </td>
                </tr>
              ) : (
                winners.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">
                        {w.user?.full_name || "Anonymous Golfer"}
                      </div>
                      <div className="text-[11px] text-[#8A8F98] font-mono">
                        {w.user?.email}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-white">
                      {w.draw?.month || "—"}
                    </td>

                    <td className="py-3 px-4">
                      {w.tier === "match5" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          ★ 5/5 Jackpot
                        </span>
                      ) : w.tier === "match4" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#5E6AD2]/15 text-[#8590EA] border border-[#5E6AD2]/30">
                          4/5 Tier 2
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[#8A8F98] border border-white/[0.08]">
                          3/5 Tier 3
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {formatCurrency(w.prize_cents)}
                    </td>

                    <td className="py-3 px-4">
                      {w.verification_status === "approved" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : w.verification_status === "submitted" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Clock className="w-3 h-3" />
                          Submitted
                        </span>
                      ) : w.verification_status === "rejected" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[#8A8F98] border border-white/[0.08]">
                          Awaiting Proof
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {w.payment_status === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Paid
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8A8F98] font-mono">Unpaid</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openInspectModal(w)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-medium transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Audit</span>
                        </button>

                        {w.verification_status === "approved" &&
                          w.payment_status !== "paid" && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(w.id)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Inspection Modal */}
      {inspectingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setInspectingWinner(null)}
          />

          <div className="relative w-full max-w-2xl bg-[#0F1011] border border-white/[0.12] rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    Scorecard Proof Audit
                  </h2>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/[0.04] text-[#8A8F98]">
                    {inspectingWinner.tier}
                  </span>
                </div>
                <p className="text-xs text-[#8A8F98] mt-0.5">
                  Golfer: <strong>{inspectingWinner.user?.full_name}</strong> ({inspectingWinner.user?.email})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingWinner(null)}
                className="p-1 rounded text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prize & Status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8A8F98] uppercase font-mono">Prize Pool</span>
                <div className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(inspectingWinner.prize_cents)}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8A8F98] uppercase font-mono">Verification</span>
                <div className="text-xs font-semibold text-white mt-1 capitalize">
                  {inspectingWinner.verification_status}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8A8F98] uppercase font-mono">Disbursement</span>
                <div className="text-xs font-semibold text-white mt-1 capitalize">
                  {inspectingWinner.payment_status}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] text-[#8A8F98] uppercase font-mono">Cycle</span>
                <div className="text-xs font-semibold text-white mt-1 font-mono">
                  {inspectingWinner.draw?.month}
                </div>
              </div>
            </div>

            {/* Scorecard Image Proof Preview */}
            <div className="p-4 rounded-lg bg-[#08090A] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[#5E6AD2]" />
                  Uploaded Signed Scorecard
                </span>
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#8590EA] hover:underline flex items-center gap-1"
                  >
                    <span>Open full resolution</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {loadingSignedUrl ? (
                <div className="h-64 flex flex-col items-center justify-center text-xs text-[#8A8F98]">
                  <div className="inline-block w-6 h-6 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
                  <div>Generating secure temporary signed URL...</div>
                </div>
              ) : signedUrl ? (
                <div className="rounded-md overflow-hidden border border-white/10 max-h-96 flex items-center justify-center bg-black/40">
                  <img
                    src={signedUrl}
                    alt="Scorecard Proof"
                    className="max-h-96 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-xs text-[#8A8F98]">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
                  <div>The winner has not uploaded scorecard proof yet.</div>
                </div>
              )}
            </div>

            {/* Review Decision Controls (only if verification !== 'approved' or allow re-review) */}
            {inspectingWinner.verification_status !== "approved" && (
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                <h4 className="text-xs font-semibold text-white uppercase font-mono">
                  Review Decision
                </h4>

                <div>
                  <label className="block text-[11px] text-[#8A8F98] mb-1">
                    Rejection Reason (required only if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Marker signature illegible or scores don't match entry snapshot"
                    className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleReviewAction("reject")}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Reject Proof
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReviewAction("approve")}
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    {isProcessing ? "Verifying..." : "Approve & Verify Winner"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

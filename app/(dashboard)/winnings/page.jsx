"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Trophy,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  FileCheck,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { SparkleStar } from "@/components/doodles";

export default function WinningsPage() {
  const [winnings, setWinnings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingWinnerId, setUploadingWinnerId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const fileInputRefs = useRef({});

  const refreshWinnings = async () => {
    try {
      const res = await fetch("/api/winners");
      const data = await res.json();
      if (data?.winnings) {
        setWinnings(data.winnings);
      }
    } catch (err) {
      console.warn("Failed to load winnings:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch("/api/winners");
        const data = await res.json();
        if (isMounted && data?.winnings) {
          setWinnings(data.winnings);
        }
      } catch (err) {
        console.warn("Failed to load winnings:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (winnerId, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload a PNG, JPG, or WEBP image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit");
        return;
      }
      setSelectedFiles((prev) => ({ ...prev, [winnerId]: file }));
    }
  };

  const handleUploadProof = async (winnerId) => {
    const file = selectedFiles[winnerId];
    if (!file) {
      toast.error("Please select a scorecard screenshot first");
      return;
    }

    setUploadingWinnerId(winnerId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/winners/${winnerId}/proof`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data?.error || "Failed to upload proof");
      } else {
        toast.success("Scorecard proof submitted! Verification is in progress.");
        // Clear selected file
        setSelectedFiles((prev) => {
          const updated = { ...prev };
          delete updated[winnerId];
          return updated;
        });
        await refreshWinnings();
      }
    } catch {
      toast.error("Network error uploading proof");
    } finally {
      setUploadingWinnerId(null);
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case "match5":
        return "Match 5 Jackpot (5 of 5)";
      case "match4":
        return "Match 4 Prize (4 of 5)";
      case "match3":
        return "Match 3 Prize (3 of 5)";
      default:
        return tier;
    }
  };

  const renderVerificationChip = (status) => {
    switch (status) {
      case "pending_proof":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F2C94C]/15 border border-[#F2C94C]/30 text-[#F2C94C]">
            <Clock className="w-3.5 h-3.5" />
            Proof Required
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#5E6AD2]/15 border border-[#5E6AD2]/30 text-[#8A95FF]">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4CC38A]/15 border border-[#4CC38A]/30 text-[#4CC38A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Proof Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EB5757]/15 border border-[#EB5757]/30 text-[#EB5757]">
            <XCircle className="w-3.5 h-3.5" />
            Rejected — Re-upload
          </span>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderPaymentChip = (status) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#4CC38A]/15 border border-[#4CC38A]/30 text-[#4CC38A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Payout Sent
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-[#8A8F98]">
            <CreditCard className="w-3.5 h-3.5" />
            Payout Pending
          </span>
        );
    }
  };

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-[12px] bg-[#0F1011]/85 border border-white/[0.08] relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-4 right-4 text-white/20 pointer-events-none hidden sm:block">
          <SparkleStar size={20} variant="8-point" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F2C94C]/15 border border-[#F2C94C]/30 flex items-center justify-center text-[#F2C94C]">
              <Trophy className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Prize Winnings &amp; Verification
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8F98]">
            Claim and verify your monthly draw jackpot and match prizes.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#8A8F98]">Loading your winnings...</div>
      ) : winnings.length === 0 ? (
        <Card className="bg-[#0F1011] border-white/[0.08] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-[#8A8F98]">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Winning Draws Yet</h3>
            <p className="text-xs text-[#8A8F98] max-w-sm mx-auto">
              Keep logging your verified Stableford rounds. Your 5 latest scores automatically enter
              every monthly charity draw!
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="text-xs border-white/10 text-white">
              View Active Draw Numbers
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {winnings.map((w) => {
            const needsProof = w.verification_status === "pending_proof" || w.verification_status === "rejected";
            const isApproved = w.verification_status === "approved";
            const isSubmitted = w.verification_status === "submitted";
            const prizeDollars = (w.prize_cents / 100).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
              <Card
                key={w.id}
                className="bg-[#0F1011] border-white/[0.08] p-6 sm:p-7 space-y-6 relative overflow-hidden shadow-xl"
              >
                {/* Top Row: Draw info & Prize Amount */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm">
                        {w.draws?.month || "Monthly"} Draw
                      </Badge>
                      <span className="text-xs text-[#8A8F98] font-medium">{getTierLabel(w.tier)}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                      <span>${prizeDollars}</span>
                      <span className="text-xs font-normal text-[#4CC38A]">Prize Allocated</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {renderVerificationChip(w.verification_status)}
                    {renderPaymentChip(w.payment_status)}
                  </div>
                </div>

                {/* Proof & Action Flow */}
                {needsProof && (
                  <div className="p-5 rounded-[10px] bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-[#F2C94C] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          {w.verification_status === "rejected"
                            ? "Scorecard Rejected — Please Re-upload"
                            : "Upload Scorecard Proof to Claim Prize"}
                        </h4>
                        <p className="text-xs text-[#8A8F98] leading-relaxed">
                          Please upload a clear screenshot of your scorecard or digital golf app confirming your 5 Stableford scores.
                          Max file size 5MB (PNG, JPG, or WEBP).
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        ref={(el) => (fileInputRefs.current[w.id] = el)}
                        onChange={(e) => handleFileChange(w.id, e)}
                        className="text-xs text-[#8A8F98] file:mr-3 file:py-1.5 file:px-3 file:rounded-[6px] file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/15 cursor-pointer"
                      />

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUploadProof(w.id)}
                        isLoading={uploadingWinnerId === w.id}
                        disabled={!selectedFiles[w.id]}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        className="text-xs shrink-0 bg-[#5E6AD2] hover:bg-[#6875E8]"
                      >
                        Submit Scorecard Proof
                      </Button>
                    </div>
                  </div>
                )}

                {isSubmitted && (
                  <div className="p-4 rounded-[10px] bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-between gap-4 text-xs text-[#8A95FF]">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-4 h-4 text-[#8A95FF]" />
                      <span>
                        Your scorecard proof is submitted and currently under review by our audit team.
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 shrink-0">1–2 business days</span>
                  </div>
                )}

                {isApproved && (
                  <div className="p-4 rounded-[10px] bg-[#4CC38A]/10 border border-[#4CC38A]/25 flex items-center justify-between gap-4 text-xs text-[#4CC38A]">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#4CC38A]" />
                      <span>
                        Proof approved! Your payout of <strong>${prizeDollars}</strong> is queued for direct disbursement.
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

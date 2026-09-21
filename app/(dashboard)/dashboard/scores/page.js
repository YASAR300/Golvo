"use client";

import Link from "next/link";
import { Trophy, ArrowLeft, Info, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScoreManager } from "@/components/dashboard/ScoreManager";

export default function DashboardScoresPage() {
  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Page Header */}
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
              Stableford Scores &amp; Handicap
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8F98]">
            Your rolling 5 latest certified rounds. A new score automatically replaces the oldest.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm">
            Automatic Draw Sync
          </Badge>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-[10px] bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 text-xs text-[#8A8F98]">
        <Info className="w-4 h-4 text-[#5E6AD2] shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="text-white font-semibold">Rolling 5-Score Rule: </span>
          Scores range from 1 to 45 Stableford points. Only one entry is allowed per date to ensure accuracy.
          These 5 active numbers form your ticket in each monthly charity draw!
        </div>
      </div>

      {/* Score Manager Component */}
      <div className="max-w-4xl">
        <ScoreManager />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Heart,
  Calendar,
  Sparkles,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ScribbleUnderline, CurlyArrow, SparkleStar } from "@/components/doodles";

export function Hero() {
  const recentScores = [
    { score: 38, course: "Pebble Beach", diff: "+1.2", date: "Sep 18" },
    { score: 41, course: "Cypress Point", diff: "-0.8", date: "Sep 14" },
    { score: 36, course: "Torrey Pines", diff: "+2.4", date: "Sep 09" },
    { score: 42, course: "Bandon Dunes", diff: "-1.4", date: "Aug 29" },
    { score: 39, course: "Spyglass Hill", diff: "+0.5", date: "Aug 22" },
  ];

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 text-center space-y-8">
        
        {/* Top Eyebrow Tag */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2"
        >
          <Badge variant="accent" size="sm" withDot>
            Monthly Charity Draw #09 Open
          </Badge>
          <span className="hidden md:inline-flex items-center gap-1 font-caveat text-sm text-[#8A95FF] -rotate-1">
            <SparkleStar size={14} className="text-[#5E6AD2]" />
            $15,000 guaranteed pool
          </span>
        </motion.div>

        {/* Hero Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-[#F7F8F8]">
            Play your round. <br className="hidden sm:block" />
            Fund a{" "}
            <span className="relative inline-block text-white">
              cause.
              <span className="absolute -bottom-2.5 left-0 w-full pointer-events-none">
                <ScribbleUnderline size={135} height={12} className="text-[#5E6AD2]" />
              </span>
            </span>{" "}
            Win the month.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#8A8F98] max-w-2xl mx-auto leading-relaxed pt-2">
            The subscription where every Stableford score drives verified youth golf access while entering you into monthly 5-number charity jackpot draws.
          </p>
        </motion.div>

        {/* CTA Buttons with Hand-Drawn Annotation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          {/* Subtle Caveat annotation with CurlyArrow (hidden on mobile, non-overlapping) */}
          <div className="hidden md:flex absolute -left-28 -top-8 items-center gap-1.5 pointer-events-none opacity-85">
            <span className="font-caveat text-base text-[#8A95FF] rotate-[-6deg]">
              5 numbers, 1 chance
            </span>
            <CurlyArrow size={50} height={38} className="text-[#5E6AD2] translate-y-2" />
          </div>

          <a href="#pricing">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="h-12 px-6 text-sm font-semibold shadow-[0_0_24px_rgba(94,106,210,0.35)]"
            >
              Subscribe & Enter Draw
            </Button>
          </a>

          <a href="#how-it-works">
            <Button variant="secondary" size="lg" className="h-12 px-6 text-sm">
              See how it works
            </Button>
          </a>
        </motion.div>

        {/* Product Mockup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative max-w-5xl mx-auto pt-8 sm:pt-12"
        >
          {/* Subtle Ambient Radial Glow Behind Card */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-80 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(94, 106, 210, 0.28) 0%, rgba(94, 106, 210, 0.05) 55%, transparent 75%)",
              filter: "blur(40px)",
            }}
          />

          {/* Floating Card Container */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            }}
            className="rounded-[12px] bg-[#0F1011]/90 border border-white/[0.12] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl text-left"
          >
            {/* Card Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#141516] border border-white/10 flex items-center justify-center font-bold text-sm text-[#F7F8F8]">
                  YM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#F7F8F8]">
                      Yasar M.
                    </span>
                    <Badge variant="accent" size="sm">
                      Pro Member
                    </Badge>
                  </div>
                  <p className="text-xs text-[#8A8F98]">
                    Certified Handicap Index: <strong className="text-white">4.2</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" withDot>
                  Draw Eligible
                </Badge>
                <div className="text-right pl-3 border-l border-white/[0.08] hidden sm:block">
                  <div className="text-[11px] text-[#8A8F98]">Monthly Pool</div>
                  <div className="text-xs font-semibold text-[#4CC38A]">$15,000</div>
                </div>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              
              {/* Column 1 & 2: Active 5-Scores Snapshot */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#5E6AD2]" />
                    <span className="text-xs font-semibold text-[#F7F8F8] tracking-wide uppercase">
                      Active 5-Scores Snapshot
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8A8F98]">
                    Last 5 Stableford Rounds
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {recentScores.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[8px] bg-[#141516] border border-white/[0.06] text-center hover:border-white/20 transition-colors"
                    >
                      <div className="text-xl font-bold text-white tracking-tight">
                        {item.score}
                      </div>
                      <div className="text-[10px] text-[#8A8F98] truncate mt-0.5">
                        {item.course}
                      </div>
                      <div className="text-[9px] text-[#4CC38A] font-medium">
                        {item.diff}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8A8F98] pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4CC38A]" />
                    Scores locked for Sep 30 Draw
                  </span>
                  <span className="font-medium text-[#F7F8F8]">
                    Avg Differential: +0.38
                  </span>
                </div>
              </div>

              {/* Column 3: Charity Contribution & Countdown */}
              <div className="space-y-4 md:border-l md:border-white/[0.08] md:pl-6">
                
                {/* Charity Allocation Widget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[#8A8F98]">
                      <Heart className="w-3.5 h-3.5 text-[#EB5757]" />
                      Direct Cause
                    </span>
                    <span className="font-semibold text-white">15%</span>
                  </div>
                  <div className="w-full bg-[#141516] rounded-full h-2 overflow-hidden border border-white/[0.06]">
                    <div
                      className="bg-gradient-to-r from-[#5E6AD2] to-[#4CC38A] h-2 rounded-full"
                      style={{ width: "75%" }}
                    />
                  </div>
                  <div className="text-[11px] text-[#8A8F98] truncate">
                    Allocated to: <span className="text-[#F7F8F8]">Youth on Course</span>
                  </div>
                </div>

                {/* Draw Countdown Widget */}
                <div className="p-3 rounded-[8px] bg-[#141516] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8A8F98]">Next Draw In:</span>
                    <span className="text-[#F2C94C] font-semibold">9d 14h 22m</span>
                  </div>
                  <div className="text-xs font-medium text-white flex items-center justify-between pt-1">
                    <span>5-Number Match</span>
                    <span className="text-[#5E6AD2]">$6,000 Jackpot</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

export default Hero;

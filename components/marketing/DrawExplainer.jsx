"use client";

import { motion } from "framer-motion";
import { Award, Zap, Layers, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ScribbleCircle } from "@/components/doodles";

export function DrawExplainer() {
  const tiers = [
    {
      name: "Match 5 of 5",
      share: "40%",
      badge: "Grand Jackpot",
      description: "Hit all 5 numbers from your active 5-round score snapshot.",
      rollover: true,
      icon: <Award className="w-5 h-5 text-[#F2C94C]" />,
      accentBorder: "border-[#F2C94C]/30 hover:border-[#F2C94C]/60",
      pillVariant: "warning",
    },
    {
      name: "Match 4 of 5",
      share: "35%",
      badge: "Tier 2 Pool",
      description: "Match any 4 numbers drawn against your snapshot rounds.",
      rollover: false,
      icon: <Zap className="w-5 h-5 text-[#5E6AD2]" />,
      accentBorder: "border-[#5E6AD2]/30 hover:border-[#5E6AD2]/60",
      pillVariant: "accent",
    },
    {
      name: "Match 3 of 5",
      share: "25%",
      badge: "Tier 3 Pool",
      description: "Match 3 numbers drawn to win automatic cash dividend payouts.",
      rollover: false,
      icon: <Layers className="w-5 h-5 text-[#4CC38A]" />,
      accentBorder: "border-[#4CC38A]/30 hover:border-[#4CC38A]/60",
      pillVariant: "success",
    },
  ];

  return (
    <section id="draw" className="py-20 md:py-28 relative bg-[#08090A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header with Subtle Annotation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <Badge variant="accent" size="sm">
              Prize Mechanics
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F8F8]">
              The draw explained. Fair, transparent, pooled.
            </h2>
            <p className="text-sm sm:text-base text-[#8A8F98] leading-relaxed">
              Every month, 5 numbers between 1 and 45 are drawn. Golvo compares your snapshot Stableford points directly against the draw numbers.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 pb-1">
            <span className="font-caveat text-base text-[#8A8F98] rotate-1">
              5 numbers drawn, 3 winning tiers
            </span>
          </div>
        </div>

        {/* 3 Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
            >
              <Card className={`h-full border ${tier.accentBorder} transition-all duration-300 bg-[#0F1011]`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-[8px] bg-[#141516] border border-white/10 flex items-center justify-center">
                      {tier.icon}
                    </div>
                    <Badge variant={tier.pillVariant} size="sm">
                      {tier.badge}
                    </Badge>
                  </div>
                  <CardTitle className="pt-3 text-lg font-bold">
                    {tier.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {tier.share}
                    </span>
                    <span className="text-xs text-[#8A8F98]">of Net Prize Pool</span>
                  </div>

                  <p className="text-xs text-[#8A8F98] leading-relaxed">
                    {tier.description}
                  </p>

                  {tier.rollover && (
                    <div className="p-3 rounded-[6px] bg-[#F2C94C]/10 border border-[#F2C94C]/20 flex items-start gap-2 text-[11px] text-[#F2C94C]">
                      <RefreshCw className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-[spin_8s_linear_infinite]" />
                      <span>
                        <strong>Rollover Guarantee:</strong> If unclaimed, 100% of the 40% pool carries over to next month's jackpot.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Rollover Highlight Banner */}
        <div className="p-6 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8F98]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#4CC38A] animate-pulse" />
            <span>
              All draws are independently audited and cryptographic hashes are published prior to release.
            </span>
          </div>
          <span className="text-white font-medium whitespace-nowrap">
            Zero house cut on draw pools.
          </span>
        </div>

      </div>
    </section>
  );
}

export default DrawExplainer;

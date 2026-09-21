"use client";

import { motion } from "framer-motion";
import { CreditCard, Target, Shuffle, HeartHandshake, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function BentoGrid() {
  const steps = [
    {
      step: "01",
      title: "Subscribe & Choose Cause",
      description:
        "Choose monthly ($19) or yearly ($180) membership. Select your preferred golf charity and decide your direct give-back percentage (10% to 100%).",
      icon: <CreditCard className="w-5 h-5 text-[#5E6AD2]" />,
      badge: "Step 1",
      highlight: "Custom cause allocation",
    },
    {
      step: "02",
      title: "Play & Log 5 Scores",
      description:
        "Play your regular golf rounds. Enter your certified Stableford scores (1–45). Golvo automatically retains your latest 5 rounds as your active draw ticket.",
      icon: <Target className="w-5 h-5 text-[#4CC38A]" />,
      badge: "Step 2",
      highlight: "Dynamic 5-score snapshot",
    },
    {
      step: "03",
      title: "Monthly Charity Draw",
      description:
        "On the final day of every month, 5 winning numbers are generated. Match 3, 4, or all 5 of your snapshot scores to claim your share of the prize pool.",
      icon: <Shuffle className="w-5 h-5 text-[#F2C94C]" />,
      badge: "Step 3",
      highlight: "Guaranteed cash payouts",
    },
    {
      step: "04",
      title: "Impact Delivered",
      description:
        "Win or lose, your allocated charity percentage is remitted directly to non-profit programs creating youth access and veteran therapy programs.",
      icon: <HeartHandshake className="w-5 h-5 text-[#EB5757]" />,
      badge: "Step 4",
      highlight: "Verified donation receipts",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <Badge variant="accent" size="sm">
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F8F8]">
            Built for golfers who play with purpose.
          </h2>
          <p className="text-sm sm:text-base text-[#8A8F98] leading-relaxed">
            Turn your weekend rounds into verifiable charity contributions and monthly jackpot entries with zero extra effort on the course.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative rounded-[10px] bg-[#0F1011] border border-white/[0.08] p-6 sm:p-8 transition-all duration-300 hover:border-white/20 hover:bg-[#141516] hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Subtle top border glow on hover */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#5E6AD2]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 rounded-[8px] bg-[#141516] border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="font-mono text-xs font-semibold text-[#8A8F98]/60 tracking-wider">
                  {item.step}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#F7F8F8] flex items-center gap-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#8A8F98] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8A8F98]">
                <span className="text-[#F7F8F8] font-medium">
                  {item.highlight}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-[#F7F8F8] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default BentoGrid;

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { DoodleCheck } from "@/components/doodles";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      id: "player",
      name: "Player Member",
      tagline: "For avid golfers who play weekly rounds.",
      monthlyPrice: 19,
      yearlyPrice: 180,
      entries: "1 Snapshot Entry (5 Scores)",
      charityMin: "10% of subscription",
      popular: false,
      features: [
        "1 Active 5-score draw ticket per month",
        "10% to 100% customizable charity split",
        "USGA & GHIN handicap progression analytics",
        "Direct payouts to bank or Stripe account",
        "Instant round upload via phone or web",
      ],
      ctaText: "Subscribe to Player",
      ctaVariant: "secondary",
    },
    {
      id: "tour",
      name: "Tour Champion",
      tagline: "For passionate golfers driving community impact.",
      monthlyPrice: 39,
      yearlyPrice: 370,
      entries: "3 Snapshot Entries (15 Scores)",
      charityMin: "20% of subscription",
      popular: true,
      features: [
        "3 Active 5-score draw tickets per month",
        "20% minimum charity donation split",
        "Fast-track prize verification (< 24 hrs)",
        "Quarterly VIP milestone golf equipment drops",
        "Featured contributor badge on community board",
        "Dedicated golfer concierge support",
      ],
      ctaText: "Get Tour Champion",
      ctaVariant: "primary",
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header & Billing Period Switch */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge variant="accent" size="sm">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F8F8]">
            One membership. Guaranteed give-back.
          </h2>
          <p className="text-sm sm:text-base text-[#8A8F98]">
            No hidden transaction fees. Unsubscribe or switch your charity beneficiary at any moment.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-[#141516] border border-white/10 mt-4">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                !isYearly
                  ? "bg-[#0F1011] text-[#F7F8F8] shadow-sm border border-white/10"
                  : "text-[#8A8F98] hover:text-white"
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                isYearly
                  ? "bg-[#0F1011] text-[#F7F8F8] shadow-sm border border-white/10"
                  : "text-[#8A8F98] hover:text-white"
              }`}
            >
              <span>Annual billing</span>
              <span className="bg-[#4CC38A]/15 text-[#4CC38A] border border-[#4CC38A]/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {plans.map((plan, idx) => {
            const price = isYearly
              ? Math.round(plan.yearlyPrice / 12)
              : plan.monthlyPrice;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="flex"
              >
                <Card
                  className={`w-full flex flex-col justify-between relative bg-[#0F1011] transition-all duration-300 ${
                    plan.popular
                      ? "border-[#5E6AD2]/50 shadow-[0_0_30px_rgba(94,106,210,0.18)]"
                      : "border-white/[0.08]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="accent" size="sm" withDot>
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-3 pt-7">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold">
                        {plan.name}
                      </CardTitle>
                      <span className="text-xs text-[#8A8F98]">
                        {plan.entries}
                      </span>
                    </div>
                    <CardDescription>{plan.tagline}</CardDescription>

                    <div className="pt-2 flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs text-[#8A8F98]">
                        / month {isYearly ? "billed annually" : "monthly"}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2">
                    <div className="p-2.5 rounded-[6px] bg-[#141516] border border-white/[0.06] text-xs text-[#8A8F98]">
                      Charity Allocation: <strong className="text-[#F7F8F8]">{plan.charityMin}</strong>
                    </div>

                    <ul className="space-y-2.5 text-xs text-[#F7F8F8] pt-2">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <DoodleCheck size={16} className="mt-0.5 text-[#4CC38A]" />
                          <span className="text-[#8A8F98] leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-6">
                    <Link href="/register" className="w-full">
                      <Button
                        variant={plan.ctaVariant}
                        size="lg"
                        className="w-full"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        {plan.ctaText}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default Pricing;

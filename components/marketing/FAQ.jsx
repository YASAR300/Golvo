"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: "How does the 5-score snapshot rule work?",
      a: "Every time you submit a verified Stableford score from a round of golf, it gets recorded in your profile. Golvo automatically maintains your latest 5 rounds, purging older rounds. On the final day of the month, those 5 scores become your unique ticket for the charity draw.",
    },
    {
      q: "How are winning numbers chosen and verified?",
      a: "On the final day of each calendar month, 5 numbers between 1 and 45 are generated via an audited random number algorithm. Match counts (Match 5, Match 4, Match 3) are evaluated automatically against every subscriber's snapshot.",
    },
    {
      q: "What happens if no one hits all 5 numbers?",
      a: "If no subscriber matches all 5 numbers, the 40% jackpot allocation does not vanish. It automatically rolls over into the next month's pool, compounding the jackpot until a verified winner emerges.",
    },
    {
      q: "How do I choose or change my charity beneficiary?",
      a: "Inside your dashboard, you can browse all verified non-profit partners and select your designated cause. You can also adjust your give-back allocation from the 10% minimum up to 100% of your subscription at any time.",
    },
    {
      q: "How are winnings distributed and verified?",
      a: "Winners upload scorecard verification or digital handicap links. Once reviewed by our compliance team (typically under 24 hours), payouts are remitted directly via Stripe Express into your connected bank account.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 relative bg-[#08090A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="accent" size="sm">
            Common Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F8F8]">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#8A8F98]">
            Everything you need to know about the draw mechanics, scoring, and charity funding.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-[8px] bg-[#0F1011] border border-white/[0.08] transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5E6AD2]"
                >
                  <span className="text-sm font-semibold text-[#F7F8F8]">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8A8F98] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#8A8F98] leading-relaxed border-t border-white/[0.04] pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default FAQ;

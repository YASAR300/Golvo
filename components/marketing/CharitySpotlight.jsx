"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ExternalLink, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DoodleHeart } from "@/components/doodles";
import { createClient } from "@/lib/supabase/client";

const defaultFeatured = {
  name: "Youth on Course",
  slug: "youth-on-course",
  tagline: "Subsidized rounds for youth golfers nationwide",
  description:
    "Youth on Course provides access to golf for thousands of young players for $5 or less, eliminating cost barriers while fostering education, mentorship, and junior tournaments.",
  image_url:
    "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
  metrics: [
    { label: "Rounds Subsidized", value: "2.4M+" },
    { label: "Youth Members", value: "190,000+" },
    { label: "Courses Enrolled", value: "2,000+" },
  ],
};

const defaultCharities = [
  {
    name: "First Tee Foundation",
    slug: "first-tee",
    description:
      "Empowering kids through educational curricula and leadership clinics that build life-enhancing character through golf.",
    impact: "Over 3.6 million youth reached annually across 150 chapters.",
    image_url:
      "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Adaptive Golf Association",
    slug: "adaptive-golf-association",
    description:
      "Delivering specialized clubs, mobility equipment, and certified instruction to golfers with physical and cognitive challenges.",
    impact: "40+ annual tournaments tailored for adaptive athletes.",
    image_url:
      "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "PGA HOPE",
    slug: "pga-hope",
    description:
      "Free 6-to-8 week instructional golf clinics for active military duty members and veterans, taught by PGA Professionals.",
    impact: "Active in 47 PGA sections assisting 10,000+ veterans.",
    image_url:
      "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=600&q=80",
  },
];

export function CharitySpotlight() {
  const [charities, setCharities] = useState(defaultCharities);
  const [featured] = useState(defaultFeatured);

  useEffect(() => {
    async function loadCharities() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("charities")
          .select("id, name, slug, description, image_url, is_featured")
          .eq("is_active", true)
          .limit(4);

        if (!error && data && data.length > 0) {
          const nonFeatured = data.filter((c) => !c.is_featured);
          if (nonFeatured.length > 0) {
            setCharities(
              nonFeatured.slice(0, 3).map((c) => ({
                ...c,
                impact: "Verified 501(c)(3) partner organization",
              }))
            );
          }
        }
      } catch {
        // Fallback to static data smoothly
      }
    }
    loadCharities();
  }, []);

  return (
    <section id="charities" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Title with DoodleHeart */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="accent" size="sm">
                Non-Profit Partners
              </Badge>
              <div className="hidden md:inline-flex items-center gap-1.5 opacity-80">
                <DoodleHeart size={18} variant="outline" className="text-[#EB5757]" />
                <span className="font-caveat text-sm text-[#8A95FF]">
                  pick your cause
                </span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F8F8]">
              Where your subscription goes.
            </h2>
            <p className="text-sm sm:text-base text-[#8A8F98] leading-relaxed">
              You choose which foundation receives your guaranteed contribution. Every dollar transferred is documented with public receipts.
            </p>
          </div>
        </div>

        {/* Featured Charity Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-[12px] bg-[#0F1011] border border-white/[0.1] p-6 sm:p-8 md:p-10 shadow-lg overflow-hidden relative"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm" withDot>
                  Featured Partner
                </Badge>
                <span className="text-xs text-[#8A8F98]">
                  Verified 501(c)(3)
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-[#F7F8F8]">
                {featured.name}
              </h3>

              <p className="text-xs sm:text-sm text-[#8A8F98] leading-relaxed">
                {featured.description}
              </p>

              {/* Impact Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
                {featured.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {m.value}
                    </div>
                    <div className="text-[11px] text-[#8A8F98] truncate mt-0.5">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative h-56 sm:h-72 w-full rounded-[8px] overflow-hidden border border-white/[0.08]">
              <img
                src={featured.image_url}
                alt={featured.name}
                className="w-full h-full object-cover object-center filter brightness-90 hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1011] via-transparent to-transparent opacity-80" />
            </div>

          </div>
        </motion.div>

        {/* 3 Secondary Partner Charities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {charities.map((item, idx) => (
            <motion.div
              key={item.slug || item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="h-full bg-[#0F1011] hover:border-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {item.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-[#8A8F98] leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-2 text-[11px] text-[#4CC38A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.impact}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default CharitySpotlight;

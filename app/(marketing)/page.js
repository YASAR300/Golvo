"use client";

import {
  Navbar,
  Hero,
  BentoGrid,
  DrawExplainer,
  CharitySpotlight,
  Pricing,
  FAQ,
  Footer,
} from "@/components/marketing";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col selection:bg-[#5E6AD2]/30 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BentoGrid />
        <DrawExplainer />
        <CharitySpotlight />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

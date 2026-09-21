"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Heart,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  ExternalLink,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function CharityProfilePage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const [charity, setCharity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    async function loadCharity() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("charities")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (!error && data) {
          setCharity({
            ...data,
            events: Array.isArray(data.events) ? data.events : [],
          });
        }
      } catch (err) {
        console.warn("Could not load charity:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadCharity();
    }
  }, [slug]);

  const handleIndependentDonation = async (e) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : donateAmount;

    if (!finalAmount || finalAmount < 1) {
      toast.error("Please enter a valid donation amount ($1 min)");
      return;
    }

    setIsDonating(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charityId: charity.id,
          amountDollars: finalAmount,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Failed to initialize donation checkout");
        setIsDonating(false);
      }
    } catch {
      toast.error("Donation connection failed. Please try again.");
      setIsDonating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-32 text-sm text-[#8A8F98]">Loading charity profile...</div>
        <Footer />
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col justify-between">
        <Navbar />
        <div className="text-center py-32 space-y-4">
          <h2 className="text-2xl font-bold text-white">Charity Not Found</h2>
          <p className="text-sm text-[#8A8F98]">The non-profit organization requested could not be located.</p>
          <Link href="/charities">
            <Button variant="primary" size="sm">
              Back to Directory
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] selection:bg-[#5E6AD2]/30 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 0%, rgba(235, 87, 87, 0.16) 0%, rgba(8, 9, 10, 0) 100%)",
          }}
        />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-2 text-xs text-[#8A8F98]">
            <Link href="/charities" className="hover:text-white transition-colors">
              Charities
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{charity.name}</span>
          </div>

          {/* Charity Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col: Info & Gallery */}
            <div className="lg:col-span-7 space-y-8">
              {/* Banner Image */}
              <div className="relative h-64 sm:h-80 w-full rounded-[14px] overflow-hidden border border-white/10 bg-[#121315]">
                <img
                  src={charity.image_url}
                  alt={charity.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090A] via-transparent to-transparent opacity-90" />

                {charity.is_featured && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="accent" size="sm" withDot>
                      Featured Partner
                    </Badge>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#EB5757]/15 border border-[#EB5757]/30 flex items-center justify-center text-[#EB5757]">
                    <Heart className="w-5 h-5 fill-[#EB5757]/25" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {charity.name}
                    </h1>
                    <span className="text-xs text-[#4CC38A] font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified 501(c)(3) Partner Organization
                    </span>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#C5C8D0] leading-relaxed">
                  {charity.description}
                </p>
              </div>

              {/* Impact Highlights */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-[10px] bg-[#0F1011] border border-white/[0.08] space-y-1">
                  <div className="text-lg sm:text-2xl font-black text-white">100%</div>
                  <div className="text-[11px] text-[#8A8F98]">Direct Non-Profit Fund</div>
                </div>
                <div className="p-4 rounded-[10px] bg-[#0F1011] border border-white/[0.08] space-y-1">
                  <div className="text-lg sm:text-2xl font-black text-[#4CC38A]">Min 10%</div>
                  <div className="text-[11px] text-[#8A8F98]">Golvo Subscription Share</div>
                </div>
                <div className="p-4 rounded-[10px] bg-[#0F1011] border border-white/[0.08] space-y-1">
                  <div className="text-lg sm:text-2xl font-black text-[#8A95FF]">Audited</div>
                  <div className="text-[11px] text-[#8A8F98]">Transparency Reporting</div>
                </div>
              </div>

              {/* Upcoming Events Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5E6AD2]" />
                  <span>Upcoming Golf Days &amp; Events</span>
                </h3>

                {charity.events && charity.events.length > 0 ? (
                  <div className="space-y-3">
                    {charity.events.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-white">{event.name}</h4>
                          <p className="text-xs text-[#8A8F98] flex items-center gap-2">
                            <span>{event.date}</span>
                            {event.location && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#EB5757]" />
                                  {event.location}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <Badge variant="secondary" size="sm">
                          Confirmed
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8F98]">
                    No public golf clinic dates announced yet. Check back soon!
                  </p>
                )}
              </div>
            </div>

            {/* Right Col: Support CTA & Independent Donation */}
            <div className="lg:col-span-5 space-y-6">
              {/* Subscription Option Card */}
              <Card className="bg-[#0F1011] border-[#5E6AD2] shadow-[0_0_30px_rgba(94,106,210,0.18)] p-6 space-y-4">
                <div className="space-y-1">
                  <Badge variant="accent" size="sm">
                    Recommended Golfer Option
                  </Badge>
                  <CardTitle className="text-lg font-bold text-white">
                    Support via Golvo Subscription
                  </CardTitle>
                  <CardDescription className="text-xs text-[#8A8F98]">
                    10% or more of your monthly/annual membership goes directly to {charity.name},
                    while entering you into monthly 5-number jackpot draws.
                  </CardDescription>
                </div>

                <Link href={`/signup?charity=${charity.id}`}>
                  <Button variant="primary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Select as Designated Charity
                  </Button>
                </Link>
              </Card>

              {/* Independent One-Time Donation Card */}
              <Card id="donate" className="bg-[#0F1011] border-white/10 p-6 space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#EB5757]" />
                    <h3 className="text-base font-bold text-white">Make an Independent Donation</h3>
                  </div>
                  <p className="text-xs text-[#8A8F98]">
                    Direct 100% one-time tax-compliant donation to {charity.name} via Stripe.
                    (Not tied to gameplay).
                  </p>
                </div>

                <form onSubmit={handleIndependentDonation} className="space-y-4">
                  {/* Preset amounts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDonateAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`py-2 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                          donateAmount === amt && !customAmount
                            ? "bg-[#5E6AD2] text-white shadow-sm"
                            : "bg-[#141516] border border-white/10 text-[#8A8F98] hover:text-white hover:border-white/20"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom amount */}
                  <div>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Or enter custom amount ($)"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setDonateAmount(0);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#141516] border border-white/10 text-white placeholder:text-[#8A8F98] text-xs focus:outline-none focus:border-[#5E6AD2]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    className="w-full text-xs font-semibold h-10 border-white/15 hover:bg-white/10 text-white"
                    isLoading={isDonating}
                    leftIcon={<CreditCard className="w-3.5 h-3.5 text-[#4CC38A]" />}
                  >
                    Donate ${customAmount || donateAmount} via Stripe
                  </Button>
                </form>

                <p className="text-[11px] text-[#8A8F98] text-center">
                  Processed securely by Stripe. Verified 501(c)(3) tax receipt generated upon payment.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Heart, ArrowRight, Calendar, Sparkles, ExternalLink, Users } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

const defaultCharityList = [
  {
    id: "1",
    name: "Youth on Course",
    slug: "youth-on-course",
    description: "Subsidizing rounds of golf for young players nationwide for $5 or less, removing socio-economic barriers to play.",
    image_url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
    is_featured: true,
    category: "Youth Access",
    events: [{ name: "National Junior Championship", date: "Oct 15, 2026", location: "Pebble Beach" }],
  },
  {
    id: "2",
    name: "First Tee Foundation",
    slug: "first-tee",
    description: "Empowering kids and teens through educational programs that build character and instill life-enhancing values through the game of golf.",
    image_url: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80",
    is_featured: false,
    category: "Youth Access",
    events: [{ name: "Autumn Leadership Summit", date: "Nov 02, 2026", location: "Atlanta, GA" }],
  },
  {
    id: "3",
    name: "Adaptive Golf Association",
    slug: "adaptive-golf-association",
    description: "Providing customized instruction, adaptive equipment, and competitive tournaments for individuals with physical and cognitive challenges.",
    image_url: "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80",
    is_featured: false,
    category: "Adaptive Golf",
    events: [{ name: "Paralympic Hope Invitational", date: "Dec 05, 2026", location: "Scottsdale, AZ" }],
  },
  {
    id: "4",
    name: "PGA HOPE",
    slug: "pga-hope",
    description: "Helping Our Patriots Everywhere: introducing golf to active duty military and military veterans to enhance physical, mental, and emotional wellbeing.",
    image_url: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=800&q=80",
    is_featured: false,
    category: "Veterans",
    events: [{ name: "Veterans Day Cup", date: "Nov 11, 2026", location: "San Diego, CA" }],
  },
  {
    id: "5",
    name: "Women in Golf Foundation",
    slug: "women-in-golf-foundation",
    description: "Championing collegiate women golfers and creating pathways to leadership in the professional golf industry through development initiatives.",
    image_url: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80",
    is_featured: false,
    category: "Women in Golf",
    events: [{ name: "Collegiate Leadership Invitational", date: "Jan 20, 2027", location: "Pinehurst, NC" }],
  },
  {
    id: "6",
    name: "Save the Greens Trust",
    slug: "save-the-greens",
    description: "Restoring natural wetland habitats, promoting zero-chemical turf care, and fostering pollinator sanctuaries across public golf facilities.",
    image_url: "https://images.unsplash.com/photo-1500932334442-8761ee4810a7?auto=format&fit=crop&w=800&q=80",
    is_featured: false,
    category: "Environment",
    events: [{ name: "Eco-Fairway Stewardship Forum", date: "Feb 14, 2027", location: "Orlando, FL" }],
  },
];

const CATEGORIES = ["All", "Youth Access", "Veterans", "Adaptive Golf", "Women in Golf", "Environment"];

export default function CharitiesDirectoryPage() {
  const [charities, setCharities] = useState(defaultCharityList);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function loadCharities() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("charities")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false });

        if (!error && data && data.length > 0) {
          setCharities(
            data.map((c) => {
              // Map categories heuristically if not in DB
              let cat = "Youth Access";
              if (c.slug.includes("veteran") || c.slug.includes("pga-hope")) cat = "Veterans";
              else if (c.slug.includes("adaptive")) cat = "Adaptive Golf";
              else if (c.slug.includes("women")) cat = "Women in Golf";
              else if (c.slug.includes("green")) cat = "Environment";

              return {
                ...c,
                category: cat,
                events: Array.isArray(c.events) ? c.events : [],
              };
            })
          );
        }
      } catch {
        // Smooth fallback
      }
    }
    loadCharities();
  }, []);

  const filteredCharities = useMemo(() => {
    return charities.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "All" || c.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [charities, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] selection:bg-[#5E6AD2]/30 flex flex-col">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] pointer-events-none -z-10"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 0%, rgba(235, 87, 87, 0.14) 0%, rgba(8, 9, 10, 0) 100%)",
          }}
        />

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EB5757]/10 border border-[#EB5757]/20 text-[#FF8585] text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-[#EB5757]/30 text-[#EB5757]" />
              <span>100% Tax-Exempt 501(c)(3) Beneficiaries</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Partner Charities Directory
            </h1>

            <p className="text-sm sm:text-base text-[#8A8F98] max-w-2xl mx-auto leading-relaxed">
              Every round you log and monthly draw ticket you enter contributes a minimum 10% directly
              to these vetted non-profit golf initiatives.
            </p>
          </div>

          {/* Search Bar & Filter Chips */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F98]" />
              <input
                type="text"
                placeholder="Search charities by name, mission, or focus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-[10px] bg-[#0F1011] border border-white/10 text-white placeholder:text-[#8A8F98] text-sm focus:outline-none focus:border-[#5E6AD2] focus:ring-1 focus:ring-[#5E6AD2] transition-all"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-white/15 text-white border border-white/25 shadow-sm"
                      : "bg-white/[0.04] text-[#8A8F98] border border-white/[0.06] hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Charity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity) => (
              <Card
                key={charity.id || charity.slug}
                className="bg-[#0F1011] border-white/[0.08] hover:border-white/20 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Card Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-[#141516]">
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1011] via-transparent to-transparent opacity-80" />

                    {charity.is_featured && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="accent" size="sm" withDot>
                          Featured Partner
                        </Badge>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white">
                        {charity.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#8A95FF] transition-colors">
                      {charity.name}
                    </h3>

                    <p className="text-xs text-[#8A8F98] leading-relaxed line-clamp-3">
                      {charity.description}
                    </p>

                    {/* Upcoming Event Snippet */}
                    {charity.events && charity.events.length > 0 && (
                      <div className="pt-2">
                        <div className="p-2.5 rounded-[6px] bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-xs text-[#8A8F98]">
                          <Calendar className="w-3.5 h-3.5 text-[#5E6AD2] shrink-0" />
                          <span className="truncate">
                            {charity.events[0].name} ({charity.events[0].date})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 border-t border-white/[0.06] flex items-center justify-between gap-3 mt-4">
                  <Link
                    href={`/charities/${charity.slug}`}
                    className="text-xs font-semibold text-[#8A95FF] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link href={`/charities/${charity.slug}#donate`}>
                    <Button variant="secondary" size="sm" className="text-xs h-8 px-3 border-white/10 text-white hover:bg-white/10">
                      Support
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {filteredCharities.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <p className="text-base text-white font-semibold">No charities found</p>
              <p className="text-xs text-[#8A8F98]">Try adjusting your search query or filter chip.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

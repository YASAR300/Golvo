"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Heart, ArrowLeft, Check, Sparkles, Sliders, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function DashboardCharityPage() {
  const [profile, setProfile] = useState(null);
  const [charities, setCharities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [charityPercent, setCharityPercent] = useState(10);
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [planPrice, setPlanPrice] = useState(9.99);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [charityError, setCharityError] = useState("");

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (user) {
        // 1. Load Profile
        const { data: p } = await supabase
          .from("profiles")
          .select("id, charity_id, charity_percent")
          .eq("id", user.id)
          .maybeSingle();

        setProfile(p);
        if (p?.charity_id) setSelectedCharityId(p.charity_id);
        if (p?.charity_percent) setCharityPercent(p.charity_percent);

        // 2. Load Charities
        const { data: chList } = await supabase
          .from("charities")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false });

        setCharities(chList || []);

        // 3. Load user's donation history
        const { data: donList } = await supabase
          .from("donations")
          .select("id, amount_cents, type, created_at, charities(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setDonations(donList || []);

        // 4. Load subscription price
        const res = await fetch("/api/profile/charity");
        const charData = await res.json();
        if (charData?.plan_price_cents) {
          setPlanPrice(charData.plan_price_cents / 100);
        }
      }
    } catch (err) {
      console.warn("Failed to load charity dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (overrideCharityId = null) => {
    const numPercent = Number(charityPercent);
    if (isNaN(numPercent) || numPercent < 10) {
      setCharityError("Contribution must be at least 10%.");
      toast.error("Contribution must be at least 10%.");
      return;
    }
    setCharityError("");
    setIsSaving(true);
    const targetCharityId = overrideCharityId || selectedCharityId;
    try {
      const res = await fetch("/api/profile/charity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charityId: targetCharityId,
          charityPercent,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data?.error || "Failed to update charity settings");
      } else {
        toast.success("Beneficiary charity and give-back percentage updated!");
        if (overrideCharityId) setSelectedCharityId(overrideCharityId);
        await loadData();
      }
    } catch {
      toast.error("Network error saving charity settings");
    } finally {
      setIsSaving(false);
    }
  };

  const currentBeneficiary = charities.find((c) => c.id === (profile?.charity_id || selectedCharityId));
  const liveDonationDollars = ((planPrice * charityPercent) / 100).toFixed(2);

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#8A8F98]">Loading charity details...</div>;
  }

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
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
              Charity Impact &amp; Allocation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8F98]">
            Direct your subscription give-back to youth access, military rehabilitation, or adaptive golf sanctuaries.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#4CC38A] bg-[#4CC38A]/10 border border-[#4CC38A]/30 px-3 py-1.5 rounded-full font-semibold">
          100% Tax-Exempt 501(c)(3)
        </span>
      </div>

      {/* Give-back Slider & Live Preview */}
      <Card className="bg-[#0F1011] border-white/[0.08] p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#EB5757]" />
              <span>Contribution Percentage</span>
            </h3>
            <p className="text-xs text-[#8A8F98]">
              Choose how much of your recurring subscription is donated (min. 10%, up to 100%).
            </p>
          </div>
          <span className="text-xl font-black text-[#FF8585] bg-[#EB5757]/10 border border-[#EB5757]/20 px-3.5 py-1 rounded-full">
            {charityPercent}% Give-Back
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={charityPercent}
              onChange={(e) => {
                setCharityPercent(parseInt(e.target.value, 10));
                setCharityError("");
              }}
              className="w-full accent-[#EB5757] cursor-pointer h-2 bg-white/10 rounded-lg"
            />
            <input
              type="number"
              min="10"
              max="100"
              name="charityPercent"
              data-testid="charity-percent"
              value={charityPercent}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCharityPercent(isNaN(val) ? "" : val);
                setCharityError("");
              }}
              className="w-20 px-2 py-1 rounded bg-[#141516] border border-white/15 text-white text-xs font-bold text-center"
            />
          </div>

          <div className="flex justify-between text-[11px] text-[#8A8F98]">
            <span>Min 10% (Required)</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100% Maximum</span>
          </div>

          {charityError && (
            <div data-testid="charity-error" className="p-3 rounded-[8px] bg-[#EB5757]/15 border border-[#EB5757]/30 text-xs text-[#EB5757] font-medium">
              {charityError}
            </div>
          )}

          <div className="p-4 rounded-[10px] bg-[#EB5757]/10 border border-[#EB5757]/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-[#FF9E9E] font-medium">Automatic Charity Donation:</span>
              <p className="text-xs text-[#8A8F98]">
                Directly sent to <strong>{currentBeneficiary?.name || "your designated charity"}</strong> each invoice.
              </p>
            </div>
            <div className="text-right">
              <div data-testid="charity-preview" className="text-2xl font-black text-white">
                ${liveDonationDollars}
              </div>
              <span className="text-[10px] text-[#8A8F98]">per billing cycle</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              data-testid="charity-save"
              onClick={() => handleSaveSettings()}
              isLoading={isSaving}
              className="text-xs bg-[#5E6AD2] hover:bg-[#6875E8]"
            >
              Save Percentage ({charityPercent}%)
            </Button>
          </div>
        </div>
      </Card>

      {/* Select Partner Charity */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white">Choose Your Partner Charity</h3>
          <select
            data-testid="charity-selector"
            name="charityId"
            value={selectedCharityId}
            onChange={(e) => {
              setSelectedCharityId(e.target.value);
              handleSaveSettings(e.target.value);
            }}
            className="px-3 py-1.5 rounded-[8px] bg-[#141516] border border-white/15 text-white text-xs focus:outline-none focus:border-[#5E6AD2]"
          >
            {charities.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0F1011] text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map((c) => {
            const isSelected = c.id === selectedCharityId;

            return (
              <Card
                key={c.id}
                className={`bg-[#0F1011] transition-all p-5 flex flex-col justify-between space-y-4 border ${
                  isSelected
                    ? "border-[#5E6AD2] ring-1 ring-[#5E6AD2] shadow-[0_0_20px_rgba(94,106,210,0.2)]"
                    : "border-white/[0.08] hover:border-white/20"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{c.name}</h4>
                    {isSelected && (
                      <Badge variant="accent" size="sm" withDot>
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#8A8F98] leading-relaxed line-clamp-3">
                    {c.description}
                  </p>
                </div>

                <Button
                  variant={isSelected ? "secondary" : "primary"}
                  size="sm"
                  disabled={isSelected}
                  onClick={() => handleSaveSettings(c.id)}
                  isLoading={isSaving && selectedCharityId === c.id}
                  className="w-full text-xs h-8"
                >
                  {isSelected ? "Current Beneficiary" : "Select as Beneficiary"}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Donation History Table */}
      <Card className="bg-[#0F1011] border-white/[0.08] p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Your Historical Charity Contributions</h3>

        {donations.length === 0 ? (
          <p className="text-xs text-[#8A8F98] py-4">
            No donations recorded yet. When your monthly subscription renews or you make an independent donation, receipts appear here!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#8A8F98]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#F7F8F8]">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Charity</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02]">
                    <td className="py-3">
                      {new Date(d.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 font-medium text-white">{d.charities?.name || "Charity"}</td>
                    <td className="py-3">
                      <span className="capitalize">{d.type.replace("_", " ")}</span>
                    </td>
                    <td className="py-3 text-right font-bold text-[#4CC38A]">
                      ${(d.amount_cents / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

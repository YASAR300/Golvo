"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Heart, X, Sparkles, Check, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

export function CharitySettingsModal({ isOpen, onClose, onUpdated }) {
  const [charities, setCharities] = useState([]);
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);
  const [planPrice, setPlanPrice] = useState(9.99);
  const [planName, setPlanName] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Load charities
        const { data: charityList } = await supabase
          .from("charities")
          .select("id, name, slug, description")
          .eq("is_active", true)
          .order("is_featured", { ascending: false });

        setCharities(charityList || []);

        // 2. Load user settings
        const res = await fetch("/api/profile/charity");
        const data = await res.json();

        if (data && !data.error) {
          if (data.charity_id) setSelectedCharityId(data.charity_id);
          else if (charityList?.length > 0) setSelectedCharityId(charityList[0].id);

          setCharityPercent(data.charity_percent || 10);
          setPlanPrice((data.plan_price_cents || 999) / 100);
          setPlanName(data.plan || "monthly");
        }
      } catch (err) {
        console.warn("Failed to load charity settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const monthlyDonation = ((planPrice * charityPercent) / 100).toFixed(2);
  const selectedCharity = charities.find((c) => c.id === selectedCharityId);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/charity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charityId: selectedCharityId,
          charityPercent,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data?.error || "Failed to update charity settings");
      } else {
        toast.success("Charity give-back settings updated!");
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch {
      toast.error("Network error saving charity settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-[14px] bg-[#0F1011] border border-white/15 p-6 shadow-2xl space-y-6 z-10 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EB5757]/15 border border-[#EB5757]/30 flex items-center justify-center text-[#EB5757]">
              <Heart className="w-4 h-4 fill-[#EB5757]/30" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Charity Give-Back Settings</h3>
              <p className="text-xs text-[#8A8F98]">Designate your partner charity &amp; contribution</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#8A8F98]">Loading charity options...</div>
        ) : (
          <div className="space-y-6">
            {/* Charity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white uppercase tracking-wider">
                Select Beneficiary Charity
              </label>
              <select
                value={selectedCharityId}
                onChange={(e) => setSelectedCharityId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#141516] border border-white/15 text-white text-xs focus:outline-none focus:border-[#5E6AD2]"
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0F1011] text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedCharity?.description && (
                <p className="text-[11px] text-[#8A8F98] leading-relaxed">
                  {selectedCharity.description}
                </p>
              )}
            </div>

            {/* Percentage Slider (10% to 100%) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white uppercase tracking-wider">
                  Contribution Percentage
                </label>
                <span className="text-sm font-bold text-[#FF8585] bg-[#EB5757]/10 border border-[#EB5757]/20 px-2.5 py-0.5 rounded-full">
                  {charityPercent}%
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={charityPercent}
                onChange={(e) => setCharityPercent(parseInt(e.target.value, 10))}
                className="w-full accent-[#EB5757] cursor-pointer h-2 bg-white/10 rounded-lg"
              />

              <div className="flex justify-between text-[10px] text-[#8A8F98]">
                <span>Min. 10%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>Max 100%</span>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 rounded-[10px] bg-[#EB5757]/10 border border-[#EB5757]/25 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#FF9E9E] font-medium">Your Monthly Charity Impact:</span>
                <span className="text-lg font-black text-white">
                  ${monthlyDonation} <span className="text-xs font-normal text-[#8A8F98]">/ {planName === "yearly" ? "yr" : "mo"}</span>
                </span>
              </div>

              <p className="text-[11px] text-[#8A8F98] leading-relaxed">
                Directly transferred to <strong>{selectedCharity?.name || "your charity"}</strong> upon each subscription invoice.
              </p>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="text-xs border-white/10 text-[#8A8F98] hover:text-white"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs bg-[#5E6AD2] hover:bg-[#6875E8]"
          >
            Save Give-Back Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CharitySettingsModal;

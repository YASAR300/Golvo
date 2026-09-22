"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  LayoutDashboard,
  Trophy,
  Ticket,
  Heart,
  CreditCard,
  ShieldCheck,
  Plus,
  Sliders,
  ExternalLink,
  X,
  Sparkles,
  ArrowRight,
  User,
  HelpCircle,
  BarChart3,
  Users,
} from "lucide-react";

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCharityModal,
  onOpenBillingPortal,
  customCommands,
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const defaultCommands = [
    {
      group: "WORKSPACE VIEWS",
      items: [
        {
          title: "Console Overview",
          description: "Summary dashboard, performance metrics & live draw timer",
          icon: LayoutDashboard,
          category: "nav",
          tag: "View",
          keywords: ["home", "dashboard", "overview", "summary", "stats", "timer"],
          action: () => {
            toast.success("Navigating to Overview");
            router.push("/dashboard");
          },
        },
        {
          title: "Stableford Handicap Scores",
          description: "Inspect rolling 5-score draw ticket & round log history",
          icon: Trophy,
          category: "nav",
          tag: "Scores",
          keywords: ["scores", "handicap", "stableford", "rounds", "golf", "points"],
          action: () => {
            toast.success("Opening Stableford Scores");
            router.push("/dashboard/scores");
          },
        },
        {
          title: "Monthly Charity Draws",
          description: "Live jackpot pool, rollover tracker & draw ball rules",
          icon: Ticket,
          category: "nav",
          tag: "Draws",
          keywords: ["draws", "lottery", "jackpot", "rollover", "balls", "pool"],
          action: () => {
            toast.success("Opening Monthly Draws");
            router.push("/dashboard/draws");
          },
        },
        {
          title: "Charity Give-Back & Partners",
          description: "Manage your 10%–100% donation allocation & non-profit impact",
          icon: Heart,
          category: "charity",
          tag: "Impact",
          keywords: ["charity", "give back", "donate", "nonprofit", "youth", "percentage"],
          action: () => {
            toast.success("Opening Charity Settings");
            router.push("/dashboard/charity");
          },
        },
        {
          title: "Prize Claims & Winnings",
          description: "Audit prize status, upload scorecard proofs & view payouts",
          icon: Trophy,
          category: "winnings",
          tag: "Prizes",
          keywords: ["winnings", "prizes", "cash", "payout", "proof", "verification"],
          action: () => {
            toast.success("Opening Prize Winnings");
            router.push("/winnings");
          },
        },
        {
          title: "Account & Membership Settings",
          description: "Manage subscription tier, billing portal & security",
          icon: CreditCard,
          category: "settings",
          tag: "Settings",
          keywords: ["settings", "billing", "subscription", "account", "profile", "card"],
          action: () => {
            toast.success("Opening Settings");
            router.push("/dashboard/settings");
          },
        },
      ],
    },
    {
      group: "QUICK ACTIONS",
      items: [
        {
          title: "Log a New Certified Round",
          description: "Add your latest Stableford score (1–45) to your draw ticket",
          icon: Plus,
          category: "actions",
          tag: "Action",
          keywords: ["log", "record", "add score", "new round", "entry"],
          action: () => {
            router.push("/dashboard#scores");
            toast.success("Jumped to Score Logger");
          },
        },
        {
          title: "Adjust Charity Contribution %",
          description: "Customize your give-back allocation slider (10% to 100%)",
          icon: Sliders,
          category: "charity",
          tag: "Action",
          keywords: ["charity", "slider", "percent", "giveback", "adjust"],
          action: () => {
            if (onOpenCharityModal) {
              onOpenCharityModal();
              toast.success("Opening Charity Slider");
            } else {
              router.push("/dashboard#charity");
              toast.success("Opening Charity Section");
            }
          },
        },
        {
          title: "Launch Stripe Billing Portal",
          description: "Download invoices, update card, or manage active plan",
          icon: ExternalLink,
          category: "settings",
          tag: "Stripe",
          keywords: ["stripe", "billing", "portal", "invoice", "receipt", "payment"],
          action: () => {
            if (onOpenBillingPortal) {
              onOpenBillingPortal();
            } else {
              router.push("/dashboard/settings");
            }
          },
        },
        {
          title: "Browse Public Charities Directory",
          description: "Explore youth golf initiatives and community non-profits",
          icon: Heart,
          category: "charity",
          tag: "Directory",
          keywords: ["directory", "charities", "explore", "partners"],
          action: () => {
            toast.success("Opening Charities Directory");
            router.push("/charities");
          },
        },
        {
          title: "View Membership Pricing Plans",
          description: "Compare Annual Champion ($7.99/mo) and Monthly ($9.99/mo)",
          icon: Sparkles,
          category: "actions",
          tag: "Plans",
          keywords: ["pricing", "plans", "upgrade", "annual", "monthly", "subscribe"],
          action: () => {
            toast.success("Opening Membership Plans");
            router.push("/pricing");
          },
        },
        {
          title: "Copy Shareable Console Link",
          description: "Copy the current page URL to your clipboard",
          icon: ExternalLink,
          category: "actions",
          tag: "Share",
          keywords: ["copy", "share", "link", "url"],
          action: () => {
            if (typeof window !== "undefined" && navigator?.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard!");
            }
          },
        },
      ],
    },
  ];

  const commands = customCommands || defaultCommands;

  // Filter commands by search and active category
  const filteredGroups = useMemo(() => {
    return commands
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const query = search.toLowerCase().trim();
          const matchesSearch =
            !query ||
            item.title.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query)) ||
            (item.tag && item.tag.toLowerCase().includes(query)) ||
            (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(query)));

          const matchesCategory =
            selectedCategory === "all" || item.category === selectedCategory;

          return matchesSearch && matchesCategory;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [commands, search, selectedCategory]);

  const flatItems = useMemo(() => {
    return filteredGroups.flatMap((g) => g.items);
  }, [filteredGroups]);

  // Reset selected item on search or filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search, selectedCategory]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false);
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Dark Ambient Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D0E11]/95 border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(94,106,210,0.12)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#5E6AD2]/60 to-transparent pointer-events-none" />

        {/* Search input bar */}
        <div className="flex items-center px-4 sm:px-5 h-14 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-[#8590EA] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, jump to a view, or search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder:text-[#8A8F98] outline-none border-none ring-0 focus:outline-none focus:border-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 rounded text-[#8A8F98] hover:text-white mr-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono text-[#8A8F98]">
            ESC
          </kbd>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border-b border-white/[0.04] overflow-x-auto text-[11px]">
          {[
            { id: "all", label: "All Items" },
            { id: "nav", label: "Views" },
            { id: "actions", label: "Actions" },
            { id: "charity", label: "Charity" },
            { id: "winnings", label: "Prizes" },
            { id: "settings", label: "Settings" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap font-medium ${
                selectedCategory === cat.id
                  ? "bg-[#5E6AD2]/20 text-[#8590EA] border border-[#5E6AD2]/40"
                  : "text-[#8A8F98] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results list */}
        <div className="max-h-[360px] overflow-y-auto p-2 sm:p-3 space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-[#8A8F98]">
                <Search className="w-4 h-4" />
              </div>
              <p className="text-xs text-white font-medium">No results found</p>
              <p className="text-[11px] text-[#8A8F98]">
                No commands matching &quot;{search}&quot;. Try searching for &quot;scores&quot;, &quot;draws&quot;, or &quot;charity&quot;.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#62666D]">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const globalIdx = flatItems.indexOf(item);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer group text-left ${
                        isSelected
                          ? "bg-white/[0.08] text-white border border-white/[0.1] shadow-sm"
                          : "text-[#8A8F98] hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#5E6AD2]/20 border border-[#5E6AD2]/40 text-[#8590EA]"
                              : "bg-white/[0.04] border border-white/[0.06] text-[#8A8F98] group-hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`font-medium truncate ${
                              isSelected ? "text-white" : "text-[#D0D4DC]"
                            }`}
                          >
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-[#8A8F98] truncate mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {item.tag && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              isSelected
                                ? "bg-[#5E6AD2]/20 text-[#8590EA] border border-[#5E6AD2]/30"
                                : "bg-white/[0.04] text-[#8A8F98] border border-white/[0.06]"
                            }`}
                          >
                            {item.tag}
                          </span>
                        )}
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-[#8590EA]">
                            <span>↵</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-[#08090A]/90 flex items-center justify-between text-[11px] text-[#8A8F98]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono text-[9px]">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono text-[9px]">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono text-[9px]">esc</kbd>
              <span>close</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#62666D]">Golvo Command Palette</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

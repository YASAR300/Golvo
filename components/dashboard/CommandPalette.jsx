"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export function CommandPalette({ isOpen, onClose, onOpenCharityModal, onOpenBillingPortal }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    {
      group: "Navigation",
      items: [
        {
          title: "Go to Overview",
          icon: LayoutDashboard,
          action: () => router.push("/dashboard"),
        },
        {
          title: "View Stableford Scores",
          icon: Trophy,
          action: () => router.push("/dashboard/scores"),
        },
        {
          title: "Monthly Charity Draws",
          icon: Ticket,
          action: () => router.push("/dashboard/draws"),
        },
        {
          title: "Beneficiary Charity Impact",
          icon: Heart,
          action: () => router.push("/dashboard/charity"),
        },
        {
          title: "Prize Winnings & Verification",
          icon: Trophy,
          action: () => router.push("/winnings"),
        },
        {
          title: "Membership & Billing",
          icon: CreditCard,
          action: () => router.push("/pricing"),
        },
      ],
    },
    {
      group: "Quick Actions",
      items: [
        {
          title: "Adjust Charity Give-Back %",
          icon: Sliders,
          action: () => {
            if (onOpenCharityModal) onOpenCharityModal();
          },
        },
        {
          title: "Open Stripe Billing Portal",
          icon: ExternalLink,
          action: () => {
            if (onOpenBillingPortal) onOpenBillingPortal();
          },
        },
      ],
    },
  ];

  // Flatten for keyboard navigation
  const filteredCommands = commands
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  const flatItems = filteredCommands.flatMap((g) => g.items);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle palette on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // will be handled by parent toggle
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-[12px] bg-[#0F1011] border border-white/15 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-white/[0.08] h-12">
          <Search className="w-4 h-4 text-[#8A8F98] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search console..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder:text-[#8A8F98] focus:outline-none"
          />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#8A8F98]">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8F98]">
              No commands matching &quot;{search}&quot;
            </div>
          ) : (
            filteredCommands.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]/70">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-white/[0.08] text-white font-medium"
                          : "text-[#8A8F98] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#8A8F98]"}`} />
                        <span>{item.title}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-[#8A8F98]">↵ Jump</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[11px] text-[#8A8F98]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Golvo Linear Palette</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

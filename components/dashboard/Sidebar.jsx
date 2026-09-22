"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Trophy,
  Ticket,
  Heart,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  ChevronDown,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [charity, setCharity] = useState(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);

          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, charity_id, charity_percent")
            .eq("id", currentUser.id)
            .maybeSingle();

          setProfile(userProfile);

          // Authoritative Subscription Check
          let userSub = null;
          try {
            const statusRes = await fetch("/api/subscription/status");
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.isSubscribed && statusData.subscription) {
                userSub = statusData.subscription;
              }
            }
          } catch (e) {
            console.warn("Sidebar status check error:", e);
          }

          setSubscription(userSub);

          if (userProfile?.charity_id) {
            const { data: ch } = await supabase
              .from("charities")
              .select("name")
              .eq("id", userProfile.charity_id)
              .maybeSingle();
            setCharity(ch);
          }
        }
      } catch (err) {
        console.warn("Sidebar data fetch:", err);
      }
    }

    loadUserData();

    const handleSubUpdated = () => {
      loadUserData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("golvo:subscription_updated", handleSubUpdated);
      return () => window.removeEventListener("golvo:subscription_updated", handleSubUpdated);
    }
  }, []);

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    const toastId = toast.loading("Opening billing portal...");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        toast.success("Redirecting to Stripe...", { id: toastId });
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Could not open billing portal.", { id: toastId });
        setIsLoadingPortal(false);
      }
    } catch {
      toast.error("Billing portal error.", { id: toastId });
      setIsLoadingPortal(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
  };

  const isSubscribed = subscription?.status === "active";
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Golfer";
  const email = user?.email || "golfer@golvo.com";
  const isAdmin = profile?.role === "admin";
  const charityName = charity?.name || "Youth on Course";
  const charityPercent = profile?.charity_percent || 10;

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

  const navigation = [
    {
      group: "WORKSPACE",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
          current: pathname === "/dashboard",
        },
        {
          name: "Scores",
          href: "/dashboard/scores",
          icon: Trophy,
          current: pathname === "/dashboard/scores",
          badge: "Latest 5",
        },
        {
          name: "Charity",
          href: "/dashboard/charity",
          icon: Heart,
          current: pathname === "/dashboard/charity",
          accent: true,
        },
        {
          name: "Draws",
          href: "/dashboard/draws",
          icon: Ticket,
          current: pathname === "/dashboard/draws",
          badge: "40% Pot",
        },
        {
          name: "Winnings",
          href: "/winnings",
          icon: Trophy,
          current: pathname === "/winnings",
        },
        {
          name: "Settings / Billing",
          href: "/dashboard/settings",
          icon: CreditCard,
          current: pathname === "/dashboard/settings",
          badge: isSubscribed ? "Active" : "Upgrade",
          badgeColor: isSubscribed ? "bg-[#4CC38A]/15 text-[#4CC38A]" : "bg-[#5E6AD2]/20 text-[#8A95FF]",
        },
      ],
    },
  ];

  if (isAdmin) {
    navigation.push({
      group: "ADMINISTRATION",
      items: [
        {
          name: "Admin Console",
          href: "/admin",
          icon: ShieldCheck,
          current: pathname === "/admin",
        },
      ],
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#08090A] border-r border-white/[0.08] select-none">
      {/* Workspace Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo size={24} textClassName="text-sm font-bold" />
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[#8A8F98]">
            Console
          </span>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Subscription Tier Pill */}
      <div className="px-3 pt-3 pb-1">
        <div className="px-3 py-2 rounded-[8px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isSubscribed ? "bg-[#4CC38A] shadow-[0_0_8px_#4CC38A]" : "bg-[#F2C94C]")} />
            <span className="text-xs font-medium text-[#F7F8F8]">
              {isSubscribed
                ? subscription.plan === "yearly"
                  ? "Annual Champion"
                  : "Monthly Golfer"
                : "Free Preview"}
            </span>
          </div>
          {isSubscribed ? (
            <button
              onClick={handleOpenPortal}
              disabled={isLoadingPortal}
              className="text-[11px] text-[#8A8F98] hover:text-white flex items-center gap-1 transition-colors"
            >
              Manage
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          ) : (
            <Link href="/pricing">
              <span className="text-[11px] text-[#8A95FF] hover:underline font-medium">Upgrade</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8A8F98]/70">
              {section.group}
            </h3>
            <div className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium transition-all duration-150",
                      item.current
                        ? "bg-white/[0.08] text-white shadow-sm font-semibold"
                        : "text-[#8A8F98] hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          item.current ? "text-white" : "text-[#8A8F98] group-hover:text-white",
                          item.accent && "text-[#EB5757]"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10",
                          item.badgeColor || "bg-white/[0.06] text-[#8A8F98]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Charity Impact Micro-Widget */}
      <div className="p-3 mx-3 mb-3 rounded-[8px] bg-gradient-to-b from-[#EB5757]/10 to-[#EB5757]/[0.02] border border-[#EB5757]/20">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-3.5 h-3.5 text-[#EB5757] fill-[#EB5757]/30" />
          <span className="text-[11px] font-semibold text-white truncate">{charityName}</span>
        </div>
        <p className="text-[10px] text-[#8A8F98] leading-tight">
          Min. {charityPercent}% of your membership funds youth and grassroots golf sanctuaries.
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0B0C0E]/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#141516] border border-white/15 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">{fullName}</p>
            <p className="text-[11px] text-[#8A8F98] truncate">{email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign out"
          data-testid="sidebar-logout"
          className="p-1.5 rounded-[6px] text-[#8A8F98] hover:text-[#EB5757] hover:bg-[#EB5757]/10 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer with backdrop */}
      {isOpen && (
        <div data-testid="mobile-sidebar-drawer" className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#08090A]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;

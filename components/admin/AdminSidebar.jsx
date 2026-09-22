"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Ticket,
  Heart,
  Trophy,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .eq("id", user.id)
            .maybeSingle();
          setProfile(p);
        }
      } catch (err) {
        console.warn("Failed to load admin profile:", err);
      }
    }
    loadAdmin();
  }, []);

  const navItems = [
    {
      name: "Overview / Reports",
      href: "/admin",
      icon: BarChart3,
      exact: true,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Draws",
      href: "/admin/draws",
      icon: Ticket,
    },
    {
      name: "Charities",
      href: "/admin/charities",
      icon: Heart,
    },
    {
      name: "Winners",
      href: "/admin/winners",
      icon: Trophy,
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      await logoutAction().catch(() => {});
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#0A0B0D] border-r border-white/[0.08] flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2">
              <Logo size={22} textClassName="text-sm font-semibold tracking-tight" />
            </Link>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#5E6AD2]/15 text-[#8590EA] border border-[#5E6AD2]/30 font-semibold">
              Admin
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#62666D]">
              Management
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onClose?.()}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group",
                      isActive
                        ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.06]"
                        : "text-[#8A8F98] hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-[#5E6AD2]"
                          : "text-[#62666D] group-hover:text-[#8A8F98]"
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Switch */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#62666D]">
              Navigation
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-[#8A8F98] hover:text-white hover:bg-white/[0.04] transition-all group border border-dashed border-white/[0.06]"
            >
              <ArrowLeft className="w-4 h-4 text-[#8A8F98] group-hover:-translate-x-0.5 transition-transform" />
              <span>Golfer Console</span>
            </Link>
          </div>
        </div>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0D0E11]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 flex items-center justify-center text-xs font-bold text-[#8590EA] shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8590EA]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {profile?.full_name || "Admin"}
                </p>
                <p className="text-[10px] text-[#62666D] font-mono truncate">
                  {profile?.email || "admin@golvo.com"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign out"
              className="p-1.5 rounded text-[#8A8F98] hover:text-[#EB5757] hover:bg-[#EB5757]/10 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Spinner size="xs" className="text-[#EB5757]" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

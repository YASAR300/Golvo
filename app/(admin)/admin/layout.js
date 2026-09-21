"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  ShieldAlert,
  BarChart3,
  Users,
  Ticket,
  Heart,
  Trophy,
  LayoutDashboard,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { UserMenu } from "@/components/ui/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          setIsAdmin(true);
          setAdminUser(profile);
        } else {
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Admin auth check failed:", e);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, []);

  const getBreadcrumb = () => {
    if (pathname.includes("/users")) return "User Directory";
    if (pathname.includes("/draws")) return "Draw Operations";
    if (pathname.includes("/charities")) return "Charity Directory";
    if (pathname.includes("/winners")) return "Winner Verification";
    return "Overview & Analytics";
  };

  const adminCommands = [
    {
      group: "Admin Navigation",
      items: [
        {
          title: "Admin Overview & Reports",
          icon: BarChart3,
          action: () => router.push("/admin"),
        },
        {
          title: "Manage Users & Subscriptions",
          icon: Users,
          action: () => router.push("/admin/users"),
        },
        {
          title: "Draw Engine & Simulation",
          icon: Ticket,
          action: () => router.push("/admin/draws"),
        },
        {
          title: "Manage Charities & Media",
          icon: Heart,
          action: () => router.push("/admin/charities"),
        },
        {
          title: "Review Winner Proofs & Payouts",
          icon: Trophy,
          action: () => router.push("/admin/winners"),
        },
        {
          title: "Switch to Golfer Console",
          icon: LayoutDashboard,
          action: () => router.push("/dashboard"),
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl bg-[#0F1011] border border-white/[0.08] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold">Admin Privileges Required</h2>
          <p className="text-xs text-[#8A8F98] leading-relaxed">
            Your account does not have administrator access to the Golvo platform management system.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-colors"
            >
              Back to Golfer Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      {/* Linear Left Admin Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Admin Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        customCommands={adminCommands}
      />

      {/* Main Content Area */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Top Header with Breadcrumbs & Command Palette */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 bg-[#08090A]/85 border-b border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="md:hidden">
              <Link href="/admin" className="flex items-center">
                <Logo size={24} textClassName="text-xs font-bold" />
              </Link>
            </div>

            {/* Desktop Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-[#8A8F98]">Admin</span>
              <span className="text-white/20">/</span>
              <span className="text-white font-medium">{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Center/Right Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-[#8A8F98] hover:text-white transition-all text-xs cursor-pointer group"
            >
              <Search className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Search admin tools...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/70">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </button>

            <UserMenu />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

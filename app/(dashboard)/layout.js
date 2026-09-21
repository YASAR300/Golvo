"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Command } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { UserMenu } from "@/components/ui/UserMenu";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadAuth() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;
        if (currentUser) {
          setUser(currentUser);
          const { data: p } = await supabase
            .from("profiles")
            .select("id, full_name, email, role")
            .eq("id", currentUser.id)
            .maybeSingle();
          setProfile(p);
        }
      } catch (e) {
        console.warn("Auth check in layout:", e);
      }
    }
    loadAuth();
  }, []);

  const getBreadcrumb = () => {
    if (pathname.includes("/scores")) return "Stableford Scores";
    if (pathname.includes("/charity")) return "Charity Impact";
    if (pathname.includes("/draws")) return "Monthly Draws";
    if (pathname.includes("/winnings")) return "Prize Winnings";
    if (pathname.includes("/settings")) return "Settings";
    return "Overview";
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      {/* Linear Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      {/* Main Content Area shifted right by sidebar width */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Top App Header with Breadcrumbs & Command Palette */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 bg-[#08090A]/85 border-b border-white/[0.08] backdrop-blur-md">
          {/* Left: Mobile hamburger & breadcrumbs */}
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
              <Link href="/" className="flex items-center">
                <Logo size={24} textClassName="text-xs font-bold" />
              </Link>
            </div>

            {/* Desktop Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-[#8A8F98]">Console</span>
              <span className="text-white/20">/</span>
              <span className="text-white font-medium">{getBreadcrumb()}</span>
            </div>
          </div>

          {/* Center/Right: Command Palette Trigger & UserMenu */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-[#8A8F98] hover:text-white transition-all text-xs cursor-pointer group"
            >
              <Search className="w-3.5 h-3.5 text-[#8A8F98] group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Search or jump to...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/70">
                ⌘K
              </kbd>
            </button>

            <UserMenu user={user} profile={profile} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

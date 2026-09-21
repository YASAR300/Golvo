"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Logo } from "@/components/ui/Logo";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      {/* Linear Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area shifted right by sidebar width */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Mobile Top Navigation Header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#08090A]/90 border-b border-white/[0.08] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} textClassName="text-xs font-bold" />
          </Link>

          <div className="w-8" />
        </div>

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

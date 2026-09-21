"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User, Shield, ChevronDown } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { cn } from "@/lib/utils";

export function UserMenu({ user, profile, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef(null);

  const email = user?.email || profile?.email || "golfer@golvo.com";
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Golfer";
  const role = profile?.role || "subscriber";
  const isAdmin = role === "admin";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    toast.loading("Signing out...", { id: "signout" });
    await logoutAction();
  };

  const copyEmail = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(email);
      toast.success("Email copied to clipboard!");
    }
  };

  return (
    <div ref={menuRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2]"
      >
        <div className="w-8 h-8 rounded-full bg-[#141516] border border-white/10 flex items-center justify-center font-bold text-xs text-[#F7F8F8] shadow-inner">
          {initials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-[8px] bg-[#0F1011] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-white/[0.06] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F7F8F8] truncate max-w-[140px]">
                {fullName}
              </span>
              <Badge variant={isAdmin ? "accent" : "success"} size="sm">
                {isAdmin ? "Admin" : "Subscriber"}
              </Badge>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              title="Click to copy email"
              className="text-[11px] text-[#8A8F98] hover:text-white truncate block text-left transition-colors cursor-pointer"
            >
              {email}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="py-1.5 space-y-0.5 text-xs text-[#8A8F98]">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-[6px] hover:text-[#F7F8F8] hover:bg-white/[0.05] transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Golfer Dashboard</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-[6px] hover:text-[#F7F8F8] hover:bg-white/[0.05] transition-colors text-[#8A95FF]"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-1.5 border-t border-white/[0.06]">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs text-[#EB5757] hover:bg-[#EB5757]/10 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Spinner size="xs" className="text-[#EB5757]" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;

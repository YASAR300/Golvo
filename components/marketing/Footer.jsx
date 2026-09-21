"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#08090A] text-[#8A8F98] text-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
              <Logo size={28} />
            </Link>
            <p className="text-xs text-[#8A8F98] max-w-sm leading-relaxed">
              Golf performance tracking meets transparent charity prize draws. Play your round, elevate your game, and empower youth and veteran foundations.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8A8F98]">
              <span>Crafted for golfers with a cause</span>
              <Heart className="w-3 h-3 text-[#EB5757]" />
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Product
            </div>
            <ul className="space-y-2">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#draw" className="hover:text-white transition-colors">The Draw Rules</a></li>
              <li><a href="#charities" className="hover:text-white transition-colors">Partner Charities</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Platform
            </div>
            <ul className="space-y-2">
              <li><Link href="/login" className="hover:text-white transition-colors">Member Sign In</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Register Account</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Golfer Dashboard</Link></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Support FAQ</a></li>
            </ul>
          </div>

          {/* Legal / Trust */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider">
              Trust & Legal
            </div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Responsible Play</a></li>
              <li><a href="#" className="hover:text-white transition-colors">501(c)(3) Transparency</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8A8F98]">
          <p>© {new Date().getFullYear()} Golvo Platform Inc. All rights reserved.</p>
          <p>Verified non-profit distributions processed in compliance with state and federal regulations.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

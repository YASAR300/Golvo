import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-xl bg-[#0F1011] border border-white/[0.08] text-center space-y-6 shadow-2xl">
        <div className="flex justify-center">
          <Logo size={28} textClassName="text-sm font-bold" />
        </div>

        <div className="w-12 h-12 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center mx-auto text-[#8590EA]">
          <Compass className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#8590EA]">
            404 — Out of Bounds
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-[#8A8F98] leading-relaxed">
            The fairway you are looking for does not exist, has been moved, or requires different access credentials.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-semibold shadow-md shadow-[#5E6AD2]/20 transition-all"
          >
            <span>Go to Console</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A8F98] hover:text-white border border-white/[0.08] text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

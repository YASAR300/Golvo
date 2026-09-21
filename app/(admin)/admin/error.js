"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw, ArrowLeft } from "lucide-react";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Admin system error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-xl bg-[#0F1011] border border-white/[0.08] text-center space-y-4 shadow-xl">
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white">Admin Module Error</h2>
          <p className="text-xs text-[#8A8F98] mt-1">
            {error?.message || "An administrative operation encountered an exception."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Action</span>
          </button>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-[#8A8F98] hover:text-white border border-white/[0.08] text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

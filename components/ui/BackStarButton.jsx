"use client";

import { useRouter } from "next/navigation";
import { SparkleStar } from "@/components/doodles";
import { cn } from "@/lib/utils";

/**
 * Interactive SparkleStar button positioned in the card corner.
 * Clicking navigates back to previous page/tab in history, with fallback.
 */
export function BackStarButton({ className = "", fallbackUrl = "/" }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className={cn(
        "absolute top-5 right-5 text-white/40 hover:text-white transition-all duration-200",
        "hover:scale-125 active:scale-95 p-1.5 -m-1.5 rounded-full cursor-pointer group",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 z-10",
        className
      )}
    >
      <SparkleStar
        size={18}
        variant="4-point"
        className="transition-transform duration-300 group-hover:rotate-45"
      />
    </button>
  );
}

export default BackStarButton;

"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Direct Golvo Brand Logo
 * Monochrome white with soft ambient white glow, transparent, no enclosing box frame.
 */
export function Logo({ size = 32, className = "", withText = true, textClassName = "" }) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
      >
        <Image
          src="/logo.png"
          alt="Golvo Logo"
          width={size}
          height={size}
          className="object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
          priority
        />
      </div>
      {withText && (
        <span className={cn("font-bold text-lg tracking-tight text-[#F7F8F8] group-hover:text-white transition-colors", textClassName)}>
          Golvo
        </span>
      )}
    </div>
  );
}

export default Logo;

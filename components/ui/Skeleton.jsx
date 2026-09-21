"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[6px] bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;

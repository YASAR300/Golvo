"use client";

import { cn } from "@/lib/utils";

/**
 * Spinner component for async / loading indicators
 */
export function Spinner({ size = "md", className = "", ...props }) {
  const sizeClasses = {
    xs: "w-3.5 h-3.5 border-2",
    sm: "w-4 h-4 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-7 h-7 border-[2.5px]",
    xl: "w-10 h-10 border-3",
  }[size] || "w-5 h-5 border-2";

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
        sizeClasses,
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;

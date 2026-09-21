"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SparkleStar({
  variant = "4-point",
  size = 24,
  className = "",
  animate = true,
  ...props
}) {
  const isEightPoint = variant === "8-point";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-current shrink-0", className)}
      {...props}
    >
      {/* Primary 4-point star axes (slightly organic curves) */}
      <motion.path
        d="M16 2.5C16 9.8 13.8 13.2 2.5 16C13.8 18.8 16 22.2 16 29.5C16 22.2 18.2 18.8 29.5 16C18.2 13.2 16 9.8 16 2.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Secondary diagonal beams for 8-point variant */}
      {isEightPoint && (
        <motion.path
          d="M7.5 7.5C10.8 12.5 13.5 13.8 24.5 24.5M24.5 7.5C19.5 12.8 18.2 13.5 7.5 24.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0, opacity: 0 } : false}
          whileInView={animate ? { pathLength: 1, opacity: 0.8 } : false}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

export default SparkleStar;

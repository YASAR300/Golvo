"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScribbleCircle({
  size = 140,
  height = 50,
  className = "",
  animate = true,
  ...props
}) {
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 160 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#5E6AD2] overflow-visible pointer-events-none", className)}
      {...props}
    >
      <motion.path
        d="M28 12C70 4.5 136 6 151 22C164 36 128 51 86 54C42 57 8 47 4.5 32C1.5 18 36 8 82 8.5C118 8.8 148 15 156 24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default ScribbleCircle;

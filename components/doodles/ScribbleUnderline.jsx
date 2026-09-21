"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScribbleUnderline({
  size = 120,
  height = 14,
  className = "",
  animate = true,
  ...props
}) {
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 160 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#5E6AD2] overflow-visible pointer-events-none", className)}
      {...props}
    >
      {/* Upper subtle energetic stroke */}
      <motion.path
        d="M2.5 8.2C35 4.8 74 3.9 112 5.5C129 6.2 146 8.1 157.5 9.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Lower complementary organic return stroke */}
      <motion.path
        d="M8.5 13.8C42 11.2 88 9.8 124 12C136 12.7 148 13.8 154 14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 0.85 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

export default ScribbleUnderline;

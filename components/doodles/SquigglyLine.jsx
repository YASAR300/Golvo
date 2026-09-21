"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SquigglyLine({
  size = 180,
  height = 12,
  className = "",
  animate = true,
  ...props
}) {
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-white/20 overflow-visible", className)}
      {...props}
    >
      <motion.path
        d="M2 8C14 4 22 12 34 8C46 4 54 12 66 8C78 4 86 12 98 8C110 4 118 12 130 8C142 4 150 12 162 8C174 4 182 12 198 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}

export default SquigglyLine;

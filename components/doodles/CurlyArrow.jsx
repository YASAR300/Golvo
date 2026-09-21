"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function CurlyArrow({
  size = 64,
  height = 48,
  className = "",
  direction = "right-down",
  animate = true,
  ...props
}) {
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 80 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#8A95FF] overflow-visible pointer-events-none", className)}
      {...props}
    >
      {/* Curved body stroke */}
      <motion.path
        d="M6 14C22 5 52 7 62 26C68 37 61 48 48 51C40 53 34 50 35 44C36 37 46 32 58 37C64 40 70 47 74 53"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Loose arrow head */}
      <motion.path
        d="M64 54L75 54L76 43"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

export default CurlyArrow;

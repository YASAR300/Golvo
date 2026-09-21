"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DoodleHeart({
  variant = "outline",
  size = 28,
  className = "",
  animate = true,
  ...props
}) {
  const isHatched = variant === "hatched";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#EB5757] shrink-0", className)}
      {...props}
    >
      {/* Heart outline with hand-drawn loose start/end */}
      <motion.path
        d="M16 27C12 23.5 4 17.5 4 10.5C4 6.5 7.2 3.5 11.2 3.5C13.8 3.5 15.2 4.8 16 6C16.8 4.8 18.2 3.5 20.8 3.5C24.8 3.5 28 6.5 28 10.5C28 17.5 20 23.5 16 27Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Gentle diagonal hatching strokes for 'hatched' variant */}
      {isHatched && (
        <>
          <motion.path
            d="M10 12L18 8"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            whileInView={animate ? { pathLength: 1, opacity: 0.7 } : false}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
          />
          <motion.path
            d="M9 16L22 11"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            whileInView={animate ? { pathLength: 1, opacity: 0.7 } : false}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
          />
          <motion.path
            d="M11 20L20 16"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            initial={animate ? { pathLength: 0, opacity: 0 } : false}
            whileInView={animate ? { pathLength: 1, opacity: 0.7 } : false}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
          />
        </>
      )}
    </svg>
  );
}

export default DoodleHeart;

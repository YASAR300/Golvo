"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function DoodleCheck({
  size = 18,
  className = "",
  animate = true,
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#4CC38A] shrink-0", className)}
      {...props}
    >
      <motion.path
        d="M3.5 10.5C5.8 12.2 7.8 14.5 9.2 16.5C12.5 11.2 15.2 6.8 18 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        whileInView={animate ? { pathLength: 1, opacity: 1 } : false}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </svg>
  );
}

export default DoodleCheck;

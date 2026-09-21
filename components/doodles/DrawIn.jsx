"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated wrapper that reveals SVG doodle strokes on scroll using Framer Motion pathLength
 */
export function DrawIn({
  children,
  duration = 0.8,
  delay = 0.1,
  className = "",
  once = true,
  ...props
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default DrawIn;

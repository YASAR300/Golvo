"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef(function Label(
  { children, className = "", required = false, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-medium uppercase tracking-wider text-[#8A8F98] mb-1.5 select-none",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-[#EB5757] ml-1">*</span>}
    </label>
  );
});

Label.displayName = "Label";
export default Label;

"use client";

import { cn } from "@/lib/utils";

const badgeVariants = {
  accent: "bg-[#5E6AD2]/15 text-[#8A95FF] border-[#5E6AD2]/30",
  success: "bg-[#4CC38A]/15 text-[#4CC38A] border-[#4CC38A]/30",
  warning: "bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/30",
  danger: "bg-[#EB5757]/15 text-[#EB5757] border-[#EB5757]/30",
  neutral: "bg-white/[0.06] text-[#8A8F98] border-white/10",
};

const dotColors = {
  accent: "bg-[#5E6AD2]",
  success: "bg-[#4CC38A]",
  warning: "bg-[#F2C94C]",
  danger: "bg-[#EB5757]",
  neutral: "bg-[#8A8F98]",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  withDot = false,
  className = "",
  ...props
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  }[size] || "px-2.5 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border leading-none select-none tracking-wide",
        badgeVariants[variant] || badgeVariants.neutral,
        sizeStyles,
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            dotColors[variant] || dotColors.neutral
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;

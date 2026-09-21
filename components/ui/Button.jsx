"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

const variantStyles = {
  primary:
    "bg-[#5E6AD2] hover:bg-[#6E79D8] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_12px_rgba(94,106,210,0.35)] border border-[#6E79D8]/50 active:brightness-95",
  secondary:
    "bg-[#141516] hover:bg-[#1C1D1F] text-[#F7F8F8] border border-white/10 hover:border-white/20 active:bg-[#0F1011]",
  ghost:
    "bg-transparent hover:bg-white/[0.06] text-[#8A8F98] hover:text-[#F7F8F8] border border-transparent active:bg-white/[0.08]",
  danger:
    "bg-[#EB5757]/15 hover:bg-[#EB5757]/25 text-[#EB5757] border border-[#EB5757]/30 hover:border-[#EB5757]/50 active:bg-[#EB5757]/30",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-[6px]",
  md: "h-9 px-4 text-sm gap-2 rounded-[8px]",
  lg: "h-11 px-5 text-base gap-2.5 rounded-[8px]",
};

export const Button = forwardRef(function Button(
  {
    children,
    className = "",
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        "relative inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090A]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {isLoading && (
        <Spinner
          size={size === "lg" ? "md" : "sm"}
          className="text-current shrink-0"
        />
      )}
      {!isLoading && leftIcon && (
        <span className="shrink-0 inline-flex items-center">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0 inline-flex items-center">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = "Button";
export default Button;

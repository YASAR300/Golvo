"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef(function Card(
  { className = "", hoverable = false, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[8px] bg-[#0F1011] border border-white/10 text-[#F7F8F8] shadow-sm overflow-hidden",
        hoverable &&
          "transition-all duration-200 hover:border-white/20 hover:bg-[#141516] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = "Card";

export const CardHeader = forwardRef(function CardHeader(
  { className = "", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-white/[0.06]", className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef(function CardTitle(
  { className = "", as: Component = "h3", ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={cn("text-base font-semibold leading-none tracking-tight text-[#F7F8F8]", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef(function CardDescription(
  { className = "", ...props },
  ref
) {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-[#8A8F98] leading-relaxed", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef(function CardContent(
  { className = "", ...props },
  ref
) {
  return <div ref={ref} className={cn("p-5", className)} {...props} />;
});
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef(function CardFooter(
  { className = "", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-5 pt-0 border-t border-white/[0.06] mt-4 bg-white/[0.01]",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export default Card;

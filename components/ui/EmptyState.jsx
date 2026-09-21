"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionButton,
  className = "",
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[8px]",
        "border border-dashed border-white/10 bg-[#0F1011]/60",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#141516] border border-white/10 text-[#8A8F98] mb-4 shadow-inner">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-[#F7F8F8] mb-1.5">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-xs text-[#8A8F98] max-w-sm leading-relaxed mb-5">
          {description}
        </p>
      )}
      {actionButton
        ? actionButton
        : actionText && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionText}
            </Button>
          )}
    </div>
  );
}

export default EmptyState;

"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    required = false,
    rows = 4,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className={cn("w-full flex flex-col", containerClassName)}>
      {label && (
        <Label htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? errorId : helperText ? helperId : undefined
        }
        className={cn(
          "w-full px-3.5 py-2.5 bg-[#0F1011] text-[#F7F8F8] text-sm rounded-[8px] border border-white/10 resize-y",
          "placeholder:text-[#8A8F98]/50 transition-all duration-150",
          "focus-visible:outline-none focus-visible:border-[#5E6AD2] focus-visible:ring-1 focus-visible:ring-[#5E6AD2]",
          "hover:border-white/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#141516]",
          error && "border-[#EB5757] focus-visible:border-[#EB5757] focus-visible:ring-[#EB5757]",
          className
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[#EB5757] mt-1.5 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-[#8A8F98] mt-1.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Textarea.displayName = "Textarea";
export default Textarea;

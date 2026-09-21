"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    required = false,
    type = "text",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className={cn("w-full flex flex-col", containerClassName)}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 text-[#8A8F98] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full h-10 px-3.5 bg-[#0F1011] text-[#F7F8F8] text-sm rounded-[8px] border border-white/10",
            "placeholder:text-[#8A8F98]/50 transition-all duration-150",
            "focus-visible:outline-none focus-visible:border-[#5E6AD2] focus-visible:ring-1 focus-visible:ring-[#5E6AD2]",
            "hover:border-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#141516]",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-[#EB5757] focus-visible:border-[#EB5757] focus-visible:ring-[#EB5757]",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[#8A8F98] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
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

Input.displayName = "Input";
export default Input;

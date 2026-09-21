"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    children,
    options,
    placeholder,
    className = "",
    containerClassName = "",
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className={cn("w-full flex flex-col", containerClassName)}>
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full h-10 pl-3.5 pr-10 bg-[#0F1011] text-[#F7F8F8] text-sm rounded-[8px] border border-white/10 appearance-none cursor-pointer",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:border-[#5E6AD2] focus-visible:ring-1 focus-visible:ring-[#5E6AD2]",
            "hover:border-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#141516]",
            error && "border-[#EB5757] focus-visible:border-[#EB5757] focus-visible:ring-[#EB5757]",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-[#0F1011] text-[#8A8F98]">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[#0F1011] text-[#F7F8F8]"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 text-[#8A8F98] pointer-events-none flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </div>
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

Select.displayName = "Select";
export default Select;

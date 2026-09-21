"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext(null);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className = "",
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleSelect = (val) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, handleSelect }}>
      <div className={cn("w-full flex flex-col space-y-4", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({ className = "", children }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1 bg-[#141516] rounded-[8px] border border-white/10 text-[#8A8F98]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabTrigger({ value, children, className = "", disabled = false }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabTrigger must be used inside Tabs");

  const isSelected = context.activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      disabled={disabled}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => context.handleSelect(value)}
      className={cn(
        "px-3.5 py-1.5 text-xs font-medium rounded-[6px] transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E6AD2]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isSelected
          ? "bg-[#0F1011] text-[#F7F8F8] shadow-sm border border-white/10"
          : "text-[#8A8F98] hover:text-[#F7F8F8] hover:bg-white/[0.04] border border-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabContent({ value, children, className = "" }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabContent must be used inside Tabs");

  if (context.activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5E6AD2] rounded-[8px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Tabs;

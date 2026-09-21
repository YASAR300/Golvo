"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Table = forwardRef(function Table(
  { className = "", ...props },
  ref
) {
  return (
    <div className="relative w-full overflow-auto rounded-[8px] border border-white/10">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm text-left", className)}
        {...props}
      />
    </div>
  );
});
Table.displayName = "Table";

export const TableHeader = forwardRef(function TableHeader(
  { className = "", ...props },
  ref
) {
  return (
    <thead
      ref={ref}
      className={cn("bg-[#141516] border-b border-white/10", className)}
      {...props}
    />
  );
});
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef(function TableBody(
  { className = "", ...props },
  ref
) {
  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0 bg-[#0F1011]", className)}
      {...props}
    />
  );
});
TableBody.displayName = "TableBody";

export const TableRow = forwardRef(function TableRow(
  { className = "", ...props },
  ref
) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] data-[state=selected]:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
});
TableRow.displayName = "TableRow";

export const TableHead = forwardRef(function TableHead(
  { className = "", ...props },
  ref
) {
  return (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-xs font-medium text-[#8A8F98] uppercase tracking-wider align-middle",
        className
      )}
      {...props}
    />
  );
});
TableHead.displayName = "TableHead";

export const TableCell = forwardRef(function TableCell(
  { className = "", ...props },
  ref
) {
  return (
    <td
      ref={ref}
      className={cn("p-4 align-middle text-[#F7F8F8] text-sm", className)}
      {...props}
    />
  );
});
TableCell.displayName = "TableCell";

export const TableCaption = forwardRef(function TableCaption(
  { className = "", ...props },
  ref
) {
  return (
    <caption
      ref={ref}
      className={cn("mt-4 text-xs text-[#8A8F98]", className)}
      {...props}
    />
  );
});
TableCaption.displayName = "TableCaption";

export default Table;

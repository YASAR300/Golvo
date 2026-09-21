import { cn } from "@/lib/utils";

/**
 * Primitive Skeleton component with dark hairline Linear aesthetics
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/[0.04] border border-white/[0.04]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Pre-built Skeleton for KPI Stat Tiles
 */
export function StatTileSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-[10px] bg-[#0F1011] border border-white/[0.08] flex items-center justify-between animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded" />
    </div>
  );
}

/**
 * Pre-built Skeleton for Data Tables (Admin & Dashboard)
 */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0F1011] overflow-hidden animate-pulse">
      <div className="h-10 bg-white/[0.02] border-b border-white/[0.06] flex items-center px-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="h-14 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-built Skeleton for Standard Dashboard Cards
 */
export function CardSkeleton({ header = true, rows = 3 }) {
  return (
    <div className="p-6 rounded-[12px] bg-[#0F1011] border border-white/[0.08] space-y-4 animate-pulse">
      {header && (
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-[8px]" />
        ))}
      </div>
    </div>
  );
}

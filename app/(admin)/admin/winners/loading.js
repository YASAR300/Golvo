import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminWinnersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      <TableSkeleton rows={7} cols={7} />
    </div>
  );
}

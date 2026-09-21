import { Skeleton, StatTileSkeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
        <StatTileSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton rows={3} />
        </div>
        <div>
          <CardSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminDrawsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <CardSkeleton rows={3} />
      <TableSkeleton rows={6} cols={8} />
    </div>
  );
}

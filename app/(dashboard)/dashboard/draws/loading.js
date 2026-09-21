import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function DrawsLoading() {
  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <CardSkeleton rows={3} />
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}

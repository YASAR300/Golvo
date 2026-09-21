import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function CharitiesDirectoryLoading() {
  return (
    <div className="min-h-screen bg-[#08090A] py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      <div className="max-w-xl mx-auto">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} rows={3} />
        ))}
      </div>
    </div>
  );
}

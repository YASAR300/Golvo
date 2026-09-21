import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function CharityProfileLoading() {
  return (
    <div className="min-h-screen bg-[#08090A] py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-pulse">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <CardSkeleton rows={3} />
    </div>
  );
}

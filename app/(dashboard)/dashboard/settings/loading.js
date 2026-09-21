import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardSkeleton rows={3} />
      <CardSkeleton rows={2} />
    </div>
  );
}

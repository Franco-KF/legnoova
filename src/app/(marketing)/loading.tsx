import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="min-h-[70vh] space-y-10 p-6 sm:p-12">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <Skeleton className="mx-auto h-4 w-32" />
        <Skeleton className="mx-auto h-14 w-full max-w-2xl" />
        <Skeleton className="mx-auto h-5 w-full max-w-xl" />
        <Skeleton className="mx-auto h-12 w-44 rounded-xl" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-3">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

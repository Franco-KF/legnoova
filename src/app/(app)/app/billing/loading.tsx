import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-9 w-56" /><Skeleton className="h-4 w-full max-w-xl" /></div>
      <div className="grid gap-5 sm:grid-cols-2"><Skeleton className="h-96 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>
    </div>
  );
}

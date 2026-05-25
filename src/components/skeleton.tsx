export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-container-high dark:bg-white/5 ${className}`}
    />
  );
}

export function BillCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-20 h-3" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-12 h-4 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-full h-2 rounded-full" />
    </div>
  );
}

export function ParticipantSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
      <Skeleton className="w-20 h-8 rounded-full" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-2">
      <Skeleton className="w-24 h-3" />
      <Skeleton className="w-20 h-7" />
    </div>
  );
}

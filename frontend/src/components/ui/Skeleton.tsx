export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} />;
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Portada */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-unior-100 to-slate-100">
        <div className="absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
        <div className="flex items-center justify-between border-t border-unior-900/[0.06] pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-unior-900/10 bg-paper-100/60 px-4 py-3.5">
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="divide-y divide-unior-900/10">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

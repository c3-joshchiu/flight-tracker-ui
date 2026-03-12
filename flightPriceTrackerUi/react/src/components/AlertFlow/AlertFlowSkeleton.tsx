export default function AlertFlowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch">
      {/* Node 1 skeleton */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-3 w-28" />
        <div className="skeleton mt-auto h-8 w-full" />
      </div>

      {/* Connector skeleton */}
      <div className="hidden shrink-0 items-center self-center px-3 sm:flex">
        <div className="h-0.5 w-10 rounded-full bg-border" />
        <div
          className="h-3 w-2 bg-border"
          style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
        />
      </div>
      <div className="flex flex-col items-center py-2 sm:hidden">
        <div className="h-6 w-0.5 bg-border" />
      </div>

      {/* Node 2 skeleton */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-5 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      </div>

      {/* Connector skeleton */}
      <div className="hidden shrink-0 items-center self-center px-3 sm:flex">
        <div className="h-0.5 w-10 rounded-full bg-border" />
        <div
          className="h-3 w-2 bg-border"
          style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
        />
      </div>
      <div className="flex flex-col items-center py-2 sm:hidden">
        <div className="h-6 w-0.5 bg-border" />
      </div>

      {/* Node 3 skeleton */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="skeleton h-3 w-16" />
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-full" />
        </div>
      </div>
    </div>
  );
}

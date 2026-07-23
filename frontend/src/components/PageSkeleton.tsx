
/** Reusable loading skeleton for list-based pages */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="px-4 pt-10 space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-1/3" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 bg-muted rounded-2xl" />
      ))}
    </div>
  )
}

/** Full page error with retry */
export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center gap-4">
      <p className="text-2xl">⚠️</p>
      <p className="font-semibold text-foreground">Something went wrong</p>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
      >
        Retry
      </button>
    </div>
  )
}

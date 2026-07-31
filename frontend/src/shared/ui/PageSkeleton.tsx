
/** Reusable loading skeleton for list-based pages */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="app-page space-y-5 animate-pulse" aria-label="Loading page">
      <div className="h-10 w-1/2 rounded-2xl bg-white/8" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => <div key={i} className="h-40 rounded-[1.75rem] bg-white/8" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 rounded-[1.5rem] bg-white/8" />
      ))}
    </div>
  )
}

import { AlertTriangle } from 'lucide-react'
/** Full page error with retry */
export function PageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/15">
        <AlertTriangle className="size-6 text-destructive" />
      </span>
      <p className="text-xl font-bold tracking-[-0.03em] text-foreground">Something went wrong</p>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="pressable min-h-12 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
      >
        Retry
      </button>
    </div>
  )
}

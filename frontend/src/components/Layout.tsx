
import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
  extraPb?: string
}

export function Layout({ children, hideNav = false, extraPb }: LayoutProps) {
  const pb = extraPb ?? (hideNav ? 'pb-4' : 'pb-20')
  return (
    <div className="flex justify-center min-h-screen bg-background">
      <div className="relative w-full max-w-md flex flex-col min-h-screen bg-background">
        <main className={`flex-1 overflow-y-auto ${pb}`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}

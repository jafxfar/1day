
import { type ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
  hideNav?: boolean
  extraPb?: string
}

export function Layout({ children, hideNav = false, extraPb }: LayoutProps) {
  const paddingBottom = extraPb ?? (hideNav ? 'safe-bottom' : 'pb-28')

  return (
    <div className="min-h-[100dvh] bg-[#0f0f0f] text-foreground">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col overflow-x-clip bg-[#141414] shadow-[0_0_80px_rgba(0,0,0,0.45)]">
        <div
          id="main-content"
          className={`flex-1 pt-[env(safe-area-inset-top)] ${paddingBottom}`}
        >
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  )
}

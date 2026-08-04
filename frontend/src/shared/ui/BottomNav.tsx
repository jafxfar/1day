import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckSquare2,
  Home,
  Moon,
  Plus,
  Sun,
  Target,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog'

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/habits', icon: CheckSquare2, label: 'Habits' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/goals', icon: Target, label: 'Goals' },
] as const

export function BottomNav() {
  const navigate = useNavigate()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)

  const handleQuickAction = (path: string) => {
    setIsQuickAddOpen(false)
    navigate(path)
  }

  return (
    <>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        aria-label="Primary navigation"
      >
        <div className="app-dock pointer-events-auto grid h-[4.75rem] w-full max-w-[452px] grid-cols-[1fr_1fr_4.5rem_1fr_1fr] items-center rounded-[2rem] border border-white/10 bg-[#181818]/94 px-2 shadow-[0_1rem_3rem_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {NAV_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="pressable flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl text-[0.65rem] font-semibold"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={isActive ? 'size-5 text-primary' : 'size-5 text-[#858580]'}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span className={isActive ? 'text-primary' : 'text-[#858580]'}>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            className="pressable mx-auto -mt-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0.75rem_2rem_rgba(0,0,0,0.35)]"
            onClick={() => setIsQuickAddOpen(true)}
            aria-label="Open quick actions"
          >
            <Plus className="size-8" strokeWidth={2.2} />
          </button>

          {NAV_ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className="pressable flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl text-[0.65rem] font-semibold"
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={isActive ? 'size-5 text-primary' : 'size-5 text-[#858580]'}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  <span className={isActive ? 'text-primary' : 'text-[#858580]'}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent
          showCloseButton={false}
          className="!top-auto !bottom-0 !left-1/2 !translate-y-0 w-full max-w-[480px] rounded-t-[2rem] rounded-b-none border-white/10 bg-[#1d1d1d] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
          <DialogTitle className="mt-2 text-2xl font-bold tracking-[-0.04em]">Quick action</DialogTitle>
          <DialogDescription className="text-[#92928d]">
            Capture or close the day in three taps or fewer.
          </DialogDescription>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { path: '/morning', label: 'Morning', icon: Sun },
              { path: '/journal?compose=1', label: 'Note', icon: BookOpen },
              { path: '/evening', label: 'Evening', icon: Moon },
            ].map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                type="button"
                className="pressable flex min-h-28 flex-col items-start justify-between rounded-[1.35rem] bg-[#292929] p-4 text-left text-sm font-semibold"
                onClick={() => handleQuickAction(path)}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

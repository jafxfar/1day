
import { NavLink } from 'react-router-dom'
import { Home, Target, CheckSquare2, BookOpen, Scroll } from 'lucide-react'

const NAV_ITEMS = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/habits', icon: CheckSquare2, label: 'Habits' },
    { to: '/journal', icon: BookOpen, label: 'Journal' },
    { to: '/biography', icon: Scroll, label: 'Biography' },
] as const

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-md bg-card/95 backdrop-blur border-t border-border pointer-events-auto">
                <div className="flex items-center justify-around px-1 py-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className="flex-1">
                            {({ isActive }) => (
                                <div className={`flex flex-col items-center gap-[1px] rounded-xl transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                                    }`}>
                                    <div className={`p-0.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                                        <Icon className="w-1.8 h-1.8" strokeWidth={isActive ? 2 : 1.5} />
                                    </div>
                                    <span className="text-[10px] font-medium leading-none">{label}</span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    )
}

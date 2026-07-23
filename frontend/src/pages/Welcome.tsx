
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Button } from '../components/ui/button'
import { Sparkles, Target, CheckSquare2, BookOpen, Bot } from 'lucide-react'

const FEATURES = [
  { icon: Target,       label: 'Goals',    desc: 'Track long-term objectives' },
  { icon: CheckSquare2, label: 'Habits',   desc: 'Build daily routines' },
  { icon: BookOpen,     label: 'Journal',  desc: 'Capture your memories' },
  { icon: Bot,          label: 'AI Coach', desc: 'Personal growth assistant' },
]

export default function Welcome() {
  const navigate = useNavigate()
  const { user } = useApp()

  const handleStartDay = () => {
    if (user) {
      navigate('/morning')
    } else {
      navigate('/auth?redirect=/morning')
    }
  }

  const handleGoDashboard = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/auth?redirect=/dashboard')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background px-3 py-safe">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 pt-20">
        <div className="relative">
          <div className="w-8 h-8 rounded-3xl bg-primary flex items-center justify-center shadow-retool-lg">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="absolute -top-[2px] -right-[2px] w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">OS</span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">Life OS</h1>
          <p className="text-lg text-muted-foreground max-w-xs leading-relaxed">
            Your daily companion for living intentionally and becoming the best version of yourself.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-1 w-full max-w-xs">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col gap-0.5 bg-card border border-border rounded-2xl p-1.5 text-left"
            >
              <div className="w-3 h-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-1.5 h-1.5 text-primary" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-1 pb-12 pt-12">
        <Button
          className="w-full h-11 text-base font-semibold rounded-2xl"
          onClick={handleStartDay}
        >
          Start Your Day ✨
        </Button>
        <Button
          variant="ghost"
          className="w-full h-11 text-base rounded-2xl"
          onClick={handleGoDashboard}
        >
          Go to Dashboard
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your journey to intentional living starts here
        </p>
      </div>
    </div>
  )
}

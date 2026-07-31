import {
  Brain,
  Dumbbell,
  BookOpen,
  ShowerHead,
  Droplets,
  Activity,
  Apple,
  Moon,
  PenTool,
  Target,
  Heart,
  Smile,
  Music,
  Leaf,
  Sun,
  ClipboardList,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react'
import { createElement, type ReactElement } from 'react'

const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  Dumbbell,
  BookOpen,
  ShowerHead,
  Droplets,
  Activity,
  Apple,
  Moon,
  PenTool,
  Target,
  Heart,
  Smile,
  Music,
  Leaf,
  Sun,
  ClipboardList,
}

const getHabitIconComponent = (iconName: string): LucideIcon => {
  if (ICON_MAP[iconName]) {
    return ICON_MAP[iconName]
  }

  // Handle legacy emoji mappings
  switch (iconName) {
    case '🧘': case '🧠': return Brain
    case '💪': return Dumbbell
    case '📚': return BookOpen
    case '🚿': return ShowerHead
    case '💧': return Droplets
    case '🏃': case '🥗': return Activity
    case '🍎': return Apple
    case '😴': return Moon
    case '📝': case '✏️': return PenTool
    case '🎯': return Target
    case '❤️': return Heart
    case '🎵': return Music
    case '🌿': return Leaf
    case '☀️': return Sun
    case '📋': return ClipboardList
    default: return CheckSquare
  }
}

export const getHabitIcon = (iconName: string, className: string): ReactElement =>
  createElement(getHabitIconComponent(iconName), { className })

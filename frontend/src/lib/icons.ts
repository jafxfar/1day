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
  CheckSquare
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<any>> = {
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

// Map standard habit emoji or name to a Lucide icon
export function getHabitIcon(iconName: string): React.ComponentType<any> {
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

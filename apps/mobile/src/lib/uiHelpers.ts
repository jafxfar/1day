import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  ClipboardList,
  Droplets,
  Dumbbell,
  Heart,
  Leaf,
  Moon,
  Music,
  PenTool,
  Smile,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react-native'

const HABIT_ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  Dumbbell,
  BookOpen,
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

export const getHabitIconComponent = (iconName: string): LucideIcon => (
  HABIT_ICON_MAP[iconName] ?? Target
)

export const stripHtml = (value: string) => (
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

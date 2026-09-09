import { useMemo, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react-native'

type IntroStory = {
  title: string
  description: string
  icon: LucideIcon
}

const INTRO_STORIES: IntroStory[] = [
  {
    title: 'Keep the history of your life',
    description: 'Capture moments, wins, and lessons so every day becomes part of your story.',
    icon: BookOpen,
  },
  {
    title: 'Achieve goals together with AI',
    description: 'Turn your ambitions into clear daily steps with practical support from your AI coach.',
    icon: Target,
  },
  {
    title: 'Understand yourself better every day',
    description: 'Reflect consistently and notice patterns in mood, energy, and progress.',
    icon: Bot,
  },
]

export default function Introduction() {
  const router = useRouter()
  const [storyIndex, setStoryIndex] = useState(0)
  const isFirstStory = storyIndex === 0
  const isLastStory = storyIndex === INTRO_STORIES.length - 1
  const activeStory = INTRO_STORIES[storyIndex]
  const ActiveStoryIcon = activeStory.icon

  const progressLabel = useMemo(
    () => `Story ${storyIndex + 1} of ${INTRO_STORIES.length}`,
    [storyIndex],
  )

  const handleGoBack = () => {
    if (isFirstStory) {
      return
    }
    setStoryIndex(previousIndex => previousIndex - 1)
  }

  const handleGoNext = () => {
    if (isLastStory) {
      router.replace('/(auth)/login')
      return
    }
    setStoryIndex(previousIndex => previousIndex + 1)
  }

  const handleSkip = () => {
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Sparkles size={20} color="#151515" strokeWidth={2.4} />
            </View>
            <Text style={styles.brandText}>Life OS</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.eyebrow}>First-time setup</Text>
          <Text style={styles.progressLabel} accessibilityLiveRegion="polite">
            {progressLabel}
          </Text>
          <View style={styles.progressRow} accessible={false}>
            {INTRO_STORIES.map((story, index) => (
              <View
                key={story.title}
                style={[
                  styles.progressBar,
                  index <= storyIndex ? styles.progressBarActive : styles.progressBarIdle,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.storySection}>
          <View style={styles.storyIcon}>
            <ActiveStoryIcon size={24} color="#151515" strokeWidth={2.2} />
          </View>
          <Text style={styles.storyTitle}>{activeStory.title}</Text>
          <Text style={styles.storyDescription}>{activeStory.description}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleGoBack}
            disabled={isFirstStory}
            style={({ pressed }) => [
              styles.secondaryButton,
              isFirstStory && styles.buttonDisabled,
              pressed && !isFirstStory && styles.pressed,
            ]}
          >
            <ArrowLeft size={18} color="#92928D" />
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLastStory ? 'Continue to login' : 'Next story'}
            onPress={handleGoNext}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isLastStory ? 'Continue' : 'Next'}
            </Text>
            <ArrowRight size={18} color="#151515" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: '#92928D',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBlock: {
    marginTop: 28,
  },
  eyebrow: {
    marginBottom: 8,
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  progressLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  progressBarActive: {
    backgroundColor: '#D7FF35',
  },
  progressBarIdle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  storySection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  storyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  storyTitle: {
    maxWidth: 360,
    color: '#F4F4F0',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1.6,
  },
  storyDescription: {
    marginTop: 20,
    maxWidth: 360,
    color: '#92928D',
    fontSize: 16,
    lineHeight: 28,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#92928D',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
})

import { useState } from 'react'
import { useRouter } from 'expo-router'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  BookOpen,
  Bot,
  CheckSquare,
  Home,
  Moon,
  Plus,
  Sun,
  Target,
  type LucideIcon,
} from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type TabBarProps = {
  state: {
    index: number
    routes: Array<{ key: string; name: string }>
  }
  navigation: {
    emit: (event: {
      type: string
      target: string
      canPreventDefault: boolean
    }) => { defaultPrevented: boolean }
    navigate: (name: string, params?: object) => void
  }
}

const TAB_META: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Home', icon: Home },
  habits: { label: 'Habits', icon: CheckSquare },
  chat: { label: 'Chat', icon: Bot },
  goals: { label: 'Goals', icon: Target },
}

export const CustomTabBar = ({ state, navigation }: TabBarProps) => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [quickOpen, setQuickOpen] = useState(false)

  const leftTabs = state.routes.filter(route => route.name === 'index' || route.name === 'habits')
  const rightTabs = state.routes.filter(route => route.name === 'chat' || route.name === 'goals')

  const renderTab = (route: { key: string; name: string }) => {
    const routeIndex = state.routes.findIndex(item => item.key === route.key)
    const isFocused = state.index === routeIndex
    const meta = TAB_META[route.name]
    if (!meta) return null
    const Icon = meta.icon

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={meta.label}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }}
        style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
      >
        <Icon
          size={20}
          color={isFocused ? '#D7FF35' : '#858580'}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {meta.label}
        </Text>
      </Pressable>
    )
  }

  const handleQuickAction = (href: '/(app)/morning' | '/(app)/evening' | '/(app)/(tabs)/journal') => {
    setQuickOpen(false)
    if (href === '/(app)/(tabs)/journal') {
      router.push({ pathname: '/(app)/(tabs)/journal', params: { compose: '1' } })
      return
    }
    router.push(href)
  }

  return (
    <>
      <View style={[styles.dockWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.dock} accessibilityRole="tablist">
          {leftTabs.map(renderTab)}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open quick actions"
            onPress={() => setQuickOpen(true)}
            style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
          >
            <Plus size={32} color="#151515" strokeWidth={2.2} />
          </Pressable>

          {rightTabs.map(renderTab)}
        </View>
      </View>

      <Modal
        visible={quickOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setQuickOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setQuickOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Quick action</Text>
            <Text style={styles.sheetDescription}>
              Capture or close the day in three taps or fewer.
            </Text>
            <View style={styles.sheetGrid}>
              {[
                { label: 'Morning', icon: Sun, action: () => handleQuickAction('/(app)/morning') },
                { label: 'Note', icon: BookOpen, action: () => handleQuickAction('/(app)/(tabs)/journal') },
                { label: 'Evening', icon: Moon, action: () => handleQuickAction('/(app)/evening') },
              ].map(({ label, icon: Icon, action }) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={action}
                  style={({ pressed }) => [styles.sheetCard, pressed && styles.pressed]}
                >
                  <View style={styles.sheetCardIcon}>
                    <Icon size={20} color="#151515" />
                  </View>
                  <Text style={styles.sheetCardLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  dockWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dock: {
    width: '100%',
    maxWidth: 452,
    height: 76,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(24,24,24,0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: '#858580',
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#D7FF35',
  },
  fab: {
    width: 64,
    height: 64,
    marginTop: -24,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sheetTitle: {
    marginTop: 16,
    color: '#F4F4F0',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  sheetDescription: {
    marginTop: 6,
    color: '#92928D',
    fontSize: 14,
  },
  sheetGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  sheetCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 22,
    backgroundColor: '#292929',
    padding: 16,
    justifyContent: 'space-between',
  },
  sheetCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCardLabel: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
})

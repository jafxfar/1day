import { Tabs } from 'expo-router'
import { CustomTabBar } from '@/ui/AppTabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar
          state={props.state}
          navigation={props.navigation as Parameters<typeof CustomTabBar>[0]['navigation']}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="journal" options={{ href: null, title: 'Journal' }} />
    </Tabs>
  )
}

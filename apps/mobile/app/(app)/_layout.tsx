import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="morning" />
      <Stack.Screen name="evening" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="biography" />
      <Stack.Screen name="goal-builder" />
    </Stack>
  )
}

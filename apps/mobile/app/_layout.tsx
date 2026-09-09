import 'react-native-gesture-handler'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, type ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SessionProvider } from '../src/auth/SessionProvider'
import { useSession } from '../src/auth/useSession'
import { CheckinsProvider } from '../src/checkins/CheckinsProvider'
import { OnboardingProvider } from '../src/onboarding/OnboardingProvider'
import { useOnboarding } from '../src/onboarding/useOnboarding'
import { resolvePostAuthHref } from '../src/onboarding/resolvePostAuthHref'

const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: sessionLoading } = useSession()
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboarding()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (sessionLoading) return
    if (user && onboardingLoading && !onboardingState) return

    const parts = segments as string[]
    const root = parts[0]
    const screen = parts[1]
    const inPublicGroup = root === '(public)'
    const inAuthGroup = root === '(auth)'
    const inWelcomeGroup = root === '(welcome)'
    const inOnboardingGroup = root === '(onboarding)'
    const inAppGroup = root === '(app)'
    const isFirstDayRoute = inOnboardingGroup && screen === 'first-day'
    const isOnboardingRoute = inOnboardingGroup

    if (!user) {
      if (!inPublicGroup && !inAuthGroup && !inWelcomeGroup) {
        router.replace('/(public)/introduction')
      }
      return
    }

    const destination = resolvePostAuthHref(onboardingState)

    if (inPublicGroup || inAuthGroup || inWelcomeGroup) {
      router.replace(destination)
      return
    }

    if (onboardingState?.status === 'in_progress' && !isOnboardingRoute) {
      router.replace(destination)
      return
    }

    if (
      onboardingState?.status === 'completed'
      && !onboardingState.firstDayFlowCompleted
      && (!isOnboardingRoute || !isFirstDayRoute)
    ) {
      router.replace('/(onboarding)/first-day')
      return
    }

    if (
      onboardingState
      && onboardingState.status !== 'in_progress'
      && isOnboardingRoute
      && !isFirstDayRoute
    ) {
      router.replace(onboardingState.firstDayFlowCompleted || onboardingState.status === 'skipped'
        ? '/(app)/morning'
        : '/(onboarding)/first-day')
      return
    }

    if (isFirstDayRoute && onboardingState?.firstDayFlowCompleted) {
      router.replace('/(app)/morning')
      return
    }

    if (
      onboardingState
      && onboardingState.status !== 'in_progress'
      && (onboardingState.status === 'skipped' || onboardingState.firstDayFlowCompleted)
      && !inAppGroup
      && isOnboardingRoute
    ) {
      router.replace('/(app)/morning')
    }
  }, [
    user,
    sessionLoading,
    onboardingLoading,
    onboardingState,
    segments,
    router,
  ])

  if (sessionLoading || (user && onboardingLoading && !onboardingState)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <OnboardingProvider>
        <CheckinsProvider>
          <StatusBar style="light" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthGate>
        </CheckinsProvider>
      </OnboardingProvider>
    </SessionProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
})

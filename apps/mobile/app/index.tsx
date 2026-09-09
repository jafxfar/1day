import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSession } from '../src/auth/useSession'
import { useOnboarding } from '../src/onboarding/useOnboarding'
import { resolvePostAuthHref } from '../src/onboarding/resolvePostAuthHref'

export default function Index() {
  const { user, isLoading: sessionLoading } = useSession()
  const { state: onboardingState, isLoading: onboardingLoading } = useOnboarding()

  if (sessionLoading || (user && onboardingLoading && !onboardingState)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(public)/introduction" />
  }

  return <Redirect href={resolvePostAuthHref(onboardingState)} />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
})

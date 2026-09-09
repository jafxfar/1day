import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Sparkles } from 'lucide-react-native'

import { useSession } from '@/auth/useSession'

export default function Auth() {
  const router = useRouter()
  const { redirect } = useLocalSearchParams<{ redirect?: string }>()

  const redirectPath = redirect ?? '/(app)/morning'

  const { login, register } = useSession()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await login({
          email,
          password,
        })

        router.replace(redirectPath as any)
      } else {
        if (!firstName.trim()) {
          throw new Error('First name is required')
        }

        await register({
          email,
          password,
          firstName,
          lastName,
        })

        router.replace('/(onboarding)/profile')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.replace('/(public)/introduction')}
              disabled={loading}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft
                size={20}
                color="#F4F4F0"
              />
            </Pressable>

            <View style={styles.logo}>
              <Sparkles
                size={16}
                color="#D7FF35"
              />

              <Text style={styles.logoText}>
                Life OS
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>
                {isLogin
                  ? 'WELCOME BACK'
                  : 'BUILD YOUR SYSTEM'}
              </Text>

              <Text style={styles.title}>
                {isLogin
                  ? 'Pick up where you left off.'
                  : 'Start with one intentional day.'}
              </Text>

              <Text style={styles.description}>
                {isLogin
                  ? 'Your goals, habits, and daily focus are waiting.'
                  : 'Create an account to keep your progress in one calm place.'}
              </Text>
            </View>

            {/* Auth box */}
            <View style={styles.authBox}>

              {/* Tabs */}
              <View style={styles.tabs}>
                <Pressable
                  onPress={() => {
                    setIsLogin(true)
                    setError(null)
                  }}
                  style={[
                    styles.tab,
                    isLogin && styles.activeTab,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isLogin && styles.activeTabText,
                    ]}
                  >
                    Log in
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setIsLogin(false)
                    setError(null)
                  }}
                  style={[
                    styles.tab,
                    !isLogin && styles.activeTab,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      !isLogin && styles.activeTabText,
                    ]}
                  >
                    Sign up
                  </Text>
                </Pressable>
              </View>

              {/* Error */}
              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Registration fields */}
              {!isLogin && (
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <Text style={styles.label}>
                      First name
                    </Text>

                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Alex"
                      placeholderTextColor="#686864"
                      editable={!loading}
                      autoCapitalize="words"
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.nameField}>
                    <Text style={styles.label}>
                      Last name
                    </Text>

                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Morgan"
                      placeholderTextColor="#686864"
                      editable={!loading}
                      autoCapitalize="words"
                      style={styles.input}
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Email address
                </Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#686864"
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#686864"
                  editable={!loading}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitPressed,
                  loading && styles.submitDisabled,
                ]}
              >
                {loading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator
                      size="small"
                      color="#151515"
                    />

                    <Text style={styles.submitText}>
                      Please wait
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>
                    {isLogin
                      ? 'Log in'
                      : 'Create account'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },

  card: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    minHeight: '100%',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  logoText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '700',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  intro: {
    marginBottom: 32,
  },

  eyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },

  title: {
    color: '#F4F4F0',
    fontSize: 44,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -2,
  },

  description: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
    maxWidth: 380,
  },

  authBox: {
    backgroundColor: '#292929',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#1D1D1D',
  },

  tabText: {
    color: '#92928D',
    fontSize: 14,
    fontWeight: '700',
  },

  activeTabText: {
    color: '#D7FF35',
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    color: '#FECACA',
    fontSize: 14,
    fontWeight: '500',
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  nameField: {
    flex: 1,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1D1D1D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#F4F4F0',
    paddingHorizontal: 14,
    fontSize: 15,
  },

  submitButton: {
    height: 56,
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitPressed: {
    transform: [{ scale: 0.985 }],
  },

  submitDisabled: {
    opacity: 0.7,
  },

  submitText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '700',
  },

  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pressed: {
    opacity: 0.7,
  },
})
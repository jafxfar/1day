import { useMemo, useState } from 'react'
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
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles } from 'lucide-react-native'
import { useOnboarding } from '@/onboarding/useOnboarding'

const LANGUAGE_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
]

export default function ProfileOnboarding() {
  const router = useRouter()
  const { state, isLoading, error, saveProfile } = useOnboarding()
  const [firstName, setFirstName] = useState<string | null>(null)
  const [birthDate, setBirthDate] = useState<string | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)
  const [language, setLanguage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const systemTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const firstNameValue = firstName ?? state?.profile?.firstName ?? ''
  const birthDateValue = birthDate ?? state?.profile?.birthDate ?? ''
  const timezoneValue = timezone ?? state?.profile?.timezone ?? systemTimezone
  const languageValue = language ?? state?.profile?.language ?? 'ru'
  const busy = isLoading || submitting

  const handleSubmit = async () => {
    if (!firstNameValue.trim() || !timezoneValue || !languageValue) {
      return
    }

    setSubmitting(true)
    try {
      const result = await saveProfile({
        firstName: firstNameValue.trim(),
        birthDate: birthDateValue || null,
        timezone: timezoneValue,
        language: languageValue,
      })

      if (!result) {
        return
      }

      router.replace('/(onboarding)/setup')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.brandRow}>
                <Sparkles size={16} color="#D7FF35" />
                <Text style={styles.brandText}>Life OS setup</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>First step</Text>
              </View>
            </View>

            <Text style={styles.title}>Заполнение профиля</Text>
            <Text style={styles.description}>
              Эти данные нужны, чтобы персонализировать ваш опыт с первого дня.
            </Text>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Имя</Text>
                <TextInput
                  value={firstNameValue}
                  onChangeText={setFirstName}
                  placeholder="Алекс"
                  placeholderTextColor="#92928D"
                  autoComplete="given-name"
                  editable={!busy}
                  style={styles.input}
                  accessibilityLabel="Имя"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Дата рождения (необязательно)</Text>
                <TextInput
                  value={birthDateValue}
                  onChangeText={setBirthDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#92928D"
                  editable={!busy}
                  style={styles.input}
                  accessibilityLabel="Дата рождения"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Часовой пояс</Text>
                <TextInput
                  value={timezoneValue}
                  onChangeText={setTimezone}
                  placeholder="Europe/Moscow"
                  placeholderTextColor="#92928D"
                  editable={!busy}
                  autoCapitalize="none"
                  style={styles.input}
                  accessibilityLabel="Часовой пояс"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Язык</Text>
                <View style={styles.languageRow}>
                  {LANGUAGE_OPTIONS.map(option => {
                    const active = languageValue === option.value
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={option.label}
                        disabled={busy}
                        onPress={() => setLanguage(option.value)}
                        style={({ pressed }) => [
                          styles.languageChip,
                          active && styles.languageChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Продолжить"
                onPress={() => void handleSubmit()}
                disabled={busy || !firstNameValue.trim() || !timezoneValue || !languageValue}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (busy || !firstNameValue.trim()) && styles.buttonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {busy ? <ActivityIndicator color="#151515" /> : null}
                <Text style={styles.primaryButtonText}>Продолжить</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 32,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  brandText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#D7FF35',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F4F4F0',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 32,
    letterSpacing: -1.2,
  },
  description: {
    marginTop: 12,
    color: '#92928D',
    fontSize: 14,
    lineHeight: 24,
  },
  form: {
    marginTop: 32,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageChipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.1)',
  },
  languageChipText: {
    color: '#C1C1BD',
    fontSize: 14,
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#F4F4F0',
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
})

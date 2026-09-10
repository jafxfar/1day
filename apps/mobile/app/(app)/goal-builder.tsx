import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { CreateGoalTreePayload, GoalCategory } from '@life-os/contracts'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native'
import { ApiError } from '@/api/client'
import { goalsApi } from '@/goals/api'

type LocalStep = {
  key: string
  title: string
  deadline: string
}

const CATEGORIES: Array<{ value: GoalCategory; label: string }> = [
  { value: 'career', label: 'Career' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'finance', label: 'Finance' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'personal', label: 'Personal' },
]

const createKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const createStep = (): LocalStep => ({ key: createKey(), title: '', deadline: '' })
const toNullableDate = (value: string) => (value.trim() ? value : null)

export default function GoalBuilderScreen() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('personal')
  const [deadline, setDeadline] = useState('')
  const [showSteps, setShowSteps] = useState(false)
  const [steps, setSteps] = useState<LocalStep[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filledSteps = useMemo(() => steps.filter(step => step.title.trim()), [steps])
  const canSave = Boolean(title.trim())

  const handleSave = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Enter a goal title to continue')
      return
    }

    const payload: CreateGoalTreePayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: toNullableDate(deadline),
      steps: filledSteps.map(step => ({
        title: step.title.trim(),
        description: '',
        deadline: toNullableDate(step.deadline),
        taskType: 'other',
      })),
    }

    setLoading(true)
    try {
      await goalsApi.createTree(payload)
      router.replace('/(app)/(tabs)/goals')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft size={20} color="#F4F4F0" />
        </Pressable>
        <Text style={styles.topTitle}>Goal builder</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to achieve?"
          placeholderTextColor="#92928D"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional context"
          placeholderTextColor="#92928D"
          multiline
          style={[styles.input, styles.textarea]}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(item => (
            <Pressable
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[styles.chip, category === item.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
        <TextInput
          value={deadline}
          onChangeText={setDeadline}
          placeholder="Optional"
          placeholderTextColor="#92928D"
          style={styles.input}
        />

        {!showSteps ? (
          <Pressable
            onPress={() => {
              setShowSteps(true)
              setSteps(current => (current.length === 0 ? [createStep()] : current))
            }}
            style={styles.secondaryButton}
          >
            <Plus size={16} color="#D7FF35" />
            <Text style={styles.secondaryButtonText}>Add steps</Text>
          </Pressable>
        ) : (
          <View style={styles.stepsBlock}>
            <Text style={styles.label}>Steps</Text>
            {steps.map(step => (
              <View key={step.key} style={styles.stepRow}>
                <TextInput
                  value={step.title}
                  onChangeText={value => setSteps(current => current.map(item => (
                    item.key === step.key ? { ...item, title: value } : item
                  )))}
                  placeholder="Step title"
                  placeholderTextColor="#92928D"
                  style={[styles.input, styles.flex]}
                />
                <Pressable
                  onPress={() => {
                    setSteps(current => {
                      const next = current.filter(item => item.key !== step.key)
                      if (next.length === 0) setShowSteps(false)
                      return next
                    })
                  }}
                >
                  <Trash2 size={18} color="#92928D" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setSteps(current => [...current, createStep()])}
              style={styles.secondaryButton}
            >
              <Plus size={16} color="#D7FF35" />
              <Text style={styles.secondaryButtonText}>Another step</Text>
            </Pressable>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => void handleSave()}
          disabled={!canSave || loading}
          style={({ pressed }) => [
            styles.primaryButton,
            (!canSave || loading) && styles.buttonDisabled,
            pressed && styles.pressed,
          ]}
        >
          {loading ? <ActivityIndicator color="#151515" /> : null}
          <Text style={styles.primaryButtonText}>
            {filledSteps.length > 0 ? 'Create goal and steps' : 'Create goal'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#F4F4F0',
    fontSize: 16,
    fontWeight: '700',
  },
  spacer: { width: 44 },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  label: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#1D1D1D',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: '#D7FF35',
    backgroundColor: 'rgba(215,255,53,0.12)',
  },
  chipText: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: { color: '#F4F4F0' },
  stepsBlock: { gap: 10 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215,255,53,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#D7FF35',
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#151515',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
  },
  errorText: { color: '#FECACA' },
  buttonDisabled: { opacity: 0.5 },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})

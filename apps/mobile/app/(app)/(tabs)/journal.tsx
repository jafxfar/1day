import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { JournalEntry } from '@life-os/contracts'
import { BookOpen, Plus, Trash2 } from 'lucide-react-native'
import { journalApi } from '@/journal/api'
import { stripHtml } from '@/lib/uiHelpers'

const getMoodEmoji = (mood: number) => {
  if (mood >= 9) return '🤩'
  if (mood >= 7) return '😄'
  if (mood >= 5) return '🙂'
  if (mood >= 3) return '😐'
  return '😕'
}

export default function JournalScreen() {
  const router = useRouter()
  const { compose } = useLocalSearchParams<{ compose?: string }>()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(7)
  const [tagsText, setTagsText] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries(await journalApi.getAll())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  useEffect(() => {
    if (compose === '1') {
      setShowCreate(true)
    }
  }, [compose])

  const handleCloseCreate = () => {
    setShowCreate(false)
    if (compose === '1') {
      router.replace('/(app)/(tabs)/journal')
    }
  }

  const handleCreate = async () => {
    if (!title.trim() || !content.trim() || creating) return
    setCreating(true)
    try {
      const tags = tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
      const created = await journalApi.create({
        title: title.trim(),
        content: content.trim(),
        mood,
        energy: 7,
        tags,
      })
      setEntries(previous => [created, ...previous])
      setTitle('')
      setContent('')
      setMood(7)
      setTagsText('')
      handleCloseCreate()
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    const previous = entries
    setEntries(previous.filter(entry => entry.id !== id))
    try {
      await journalApi.delete(id)
    } catch {
      setEntries(previous)
    }
  }

  const avgMood = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length)
    : 0
  const allTags = [...new Set(entries.flatMap(entry => entry.tags))]

  if (loading && entries.length === 0) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>Private archive</Text>
            <Text style={styles.title}>Journal</Text>
            <Text style={styles.muted}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} collected
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Write a new journal entry"
            onPress={() => setShowCreate(true)}
            style={({ pressed }) => [styles.writeButton, pressed && styles.pressed]}
          >
            <Plus size={18} color="#151515" />
            <Text style={styles.writeButtonText}>Write</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void fetchEntries()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {entries.length > 0 ? (
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={[styles.statCell, styles.statCellBorder]}>
              <Text style={styles.statEmoji}>{getMoodEmoji(avgMood)}</Text>
              <Text style={styles.statLabel}>Avg mood</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, styles.statAccent]}>{allTags.length}</Text>
              <Text style={styles.statLabel}>Themes</Text>
            </View>
          </View>
        ) : null}

        {entries.length === 0 && !loading ? (
          <View style={styles.empty}>
            <BookOpen size={48} color="#151515" />
            <Text style={styles.emptyTitle}>A clear page for whatever today held.</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{entry.entryDate}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${entry.title}`}
                  onPress={() => void handleDelete(entry.id)}
                >
                  <Trash2 size={16} color="#92928D" />
                </Pressable>
              </View>
              <Text style={styles.entryTitle}>{entry.title}</Text>
              <Text style={styles.entryBody} numberOfLines={3}>
                {stripHtml(entry.content)}
              </Text>
              <Text style={styles.entryMeta}>
                Mood {entry.mood}/10
                {entry.tags.length ? ` · ${entry.tags.join(', ')}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={handleCloseCreate}>
        <Pressable style={styles.modalBackdrop} onPress={handleCloseCreate}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Write entry</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor="#92928D"
              style={styles.input}
            />
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What happened today?"
              placeholderTextColor="#92928D"
              multiline
              style={[styles.input, styles.textarea]}
            />
            <Text style={styles.fieldLabel}>Mood {mood}/10</Text>
            <View style={styles.moodRow}>
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1
                const active = mood === value
                return (
                  <Pressable
                    key={value}
                    onPress={() => setMood(value)}
                    style={[styles.moodChip, active && styles.moodChipActive]}
                  >
                    <Text style={[styles.moodText, active && styles.moodTextActive]}>{value}</Text>
                  </Pressable>
                )
              })}
            </View>
            <TextInput
              value={tagsText}
              onChangeText={setTagsText}
              placeholder="Tags, comma separated"
              placeholderTextColor="#92928D"
              style={styles.input}
            />
            <Pressable
              onPress={() => void handleCreate()}
              disabled={!title.trim() || !content.trim() || creating}
              style={({ pressed }) => [
                styles.primaryButton,
                (!title.trim() || !content.trim() || creating) && styles.buttonDisabled,
                pressed && styles.pressed,
              ]}
            >
              {creating ? <ActivityIndicator color="#151515" /> : null}
              <Text style={styles.primaryButtonText}>Save entry</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#141414' },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  eyebrow: {
    color: '#D7FF35',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#F4F4F0',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  muted: {
    marginTop: 12,
    color: '#92928D',
    fontSize: 14,
  },
  writeButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#D7FF35',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  writeButtonText: {
    color: '#151515',
    fontWeight: '700',
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 12,
    gap: 8,
  },
  errorText: { color: '#FECACA' },
  retryText: { color: '#D7FF35', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  statCellBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#F4F4F0',
    fontSize: 28,
    fontWeight: '900',
  },
  statAccent: { color: '#D7FF35' },
  statEmoji: { fontSize: 28 },
  statLabel: {
    marginTop: 8,
    color: '#92928D',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  empty: {
    borderRadius: 32,
    backgroundColor: '#F4F4F0',
    padding: 28,
    minHeight: 220,
    justifyContent: 'space-between',
    gap: 24,
  },
  emptyTitle: {
    color: '#151515',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  list: { gap: 12 },
  entryCard: {
    borderRadius: 24,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    color: '#92928D',
    fontSize: 12,
  },
  entryTitle: {
    color: '#F4F4F0',
    fontSize: 16,
    fontWeight: '700',
  },
  entryBody: {
    color: '#92928D',
    fontSize: 14,
    lineHeight: 22,
  },
  entryMeta: {
    color: '#C1C1BD',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#1D1D1D',
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  modalTitle: {
    color: '#F4F4F0',
    fontSize: 22,
    fontWeight: '800',
  },
  input: {
    borderRadius: 16,
    backgroundColor: '#141414',
    color: '#F4F4F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moodChip: {
    width: '18%',
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipActive: {
    backgroundColor: '#D7FF35',
  },
  moodText: {
    color: '#92928D',
    fontWeight: '700',
  },
  moodTextActive: {
    color: '#151515',
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
    fontWeight: '700',
  },
  buttonDisabled: { opacity: 0.5 },
  flex: { flex: 1 },
  pressed: { transform: [{ scale: 0.985 }] },
})


import { useState, useEffect } from 'react'
import { useGetJournalEntries, useCreateJournalEntry, useDeleteJournalEntry } from '../hooks/backend/journal'
import { Layout } from '../components/Layout'
import { PageSkeleton, PageError } from '../components/PageSkeleton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import type { JournalEntry } from '../lib/types'
import { cast } from '../lib/types'

const getMoodEmoji = (mood: number) => {
  if (mood >= 9) return '🤩'
  if (mood >= 7) return '😄'
  if (mood >= 5) return '🙂'
  if (mood >= 3) return '😐'
  return '😕'
}

const MOOD_EMOJI: Record<number, string> = {
  1:'😞', 2:'😕', 3:'😐', 4:'🙁', 5:'😶', 6:'🙂', 7:'😊', 8:'😄', 9:'🥰', 10:'🤩',
}

const TAG_OPTIONS = [
  'productive','happy','work','growth','rest','challenge',
  'family','focus','creative','nature','grateful','social','learning','inspired',
]

export default function Journal() {
  const { data: rawEntries, loading, error, trigger: fetchEntries } = useGetJournalEntries()
  const { trigger: createEntry, loading: creating } = useCreateJournalEntry()
  const { trigger: deleteEntry } = useDeleteJournalEntry()

  const [entries,      setEntries]      = useState<JournalEntry[]>([])
  const [showCreate,   setShowCreate]   = useState(false)
  const [title,        setTitle]        = useState('')
  const [content,      setContent]      = useState('')
  const [mood,         setMood]         = useState(7)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => { void fetchEntries() }, [])
  useEffect(() => { setEntries(cast.journalEntries(rawEntries)) }, [rawEntries])

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    const newEntry = await createEntry({ title: title.trim(), content: content.trim(), mood, energy: 7, tags: selectedTags })
    if (newEntry) {
      const mapped = cast.journalEntries([newEntry])
      if (mapped[0]) setEntries(prev => [mapped[0]!, ...prev])
    }
    setTitle(''); setContent(''); setMood(7); setSelectedTags([])
    setShowCreate(false)
  }

  const handleDelete = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await deleteEntry({ id })
  }

  const avgMood = entries.length
    ? Math.round(entries.reduce((a, e) => a + e.mood, 0) / entries.length)
    : 0
  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  if (loading && entries.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchEntries({ skipCache: true })} /></Layout>

  return (
    <Layout>
      <div className="px-4 pt-10 pb-4 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Journal</h1>
            <p className="text-sm text-muted-foreground">{entries.length} entries</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />Write
          </Button>
        </div>

        {/* ── Stats ── */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{entries.length}</p>
              <p className="text-[10px] text-muted-foreground">Entries</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{getMoodEmoji(avgMood)}</p>
              <p className="text-[10px] text-muted-foreground">Avg Mood</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className="text-xl font-bold text-foreground">{allTags.length}</p>
              <p className="text-[10px] text-muted-foreground">Tags Used</p>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {entries.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-14 h-14 text-muted-foreground mb-4" />
            <p className="font-semibold text-foreground">Your journal is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Start capturing your thoughts</p>
            <Button className="mt-6 rounded-xl" onClick={() => setShowCreate(true)}>Write First Entry</Button>
          </div>
        )}

        {/* ── Entries ── */}
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{entry.entryDate}</p>
                  <h3 className="font-semibold text-foreground mt-0.5">{entry.title}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Mood</p>
                      <p className="text-xs font-bold text-foreground">{entry.mood}/10</p>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleDelete(entry.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{entry.content}</p>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs rounded-full px-2">#{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm rounded-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" />
            <Textarea
              placeholder="What's on your mind today?"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="rounded-xl min-h-[110px]"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Mood</p>
                <span className="text-sm font-semibold text-foreground">{MOOD_EMOJI[mood] ?? '😊'} {mood}/10</span>
              </div>
              <input
                type="range" min={1} max={10} value={mood}
                onChange={e => setMood(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedTags.includes(tag)
                        ? 'border-primary bg-primary/10 text-foreground font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full rounded-xl" onClick={() => void handleCreate()} disabled={!title.trim() || !content.trim() || creating}>
              {creating ? 'Saving…' : 'Save Entry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

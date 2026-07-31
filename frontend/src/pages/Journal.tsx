
import { useEffect, useState } from 'react'
import { useCreateJournalEntry, useDeleteJournalEntry, useGetJournalEntries } from '../entities/journal/model/useJournal'
import { Layout } from '../shared/ui/Layout'
import { PageSkeleton, PageError } from '../shared/ui/PageSkeleton'
import { Button } from '../shared/ui/button'
import { Input } from '../shared/ui/input'
import { Textarea } from '../shared/ui/textarea'
import { Badge } from '../shared/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../shared/ui/dialog'
import { Plus, BookOpen, Trash2 } from 'lucide-react'

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
  const { data: entries = [], setData: setEntries, loading, error, trigger: fetchEntries } = useGetJournalEntries()
  const { trigger: createEntry, loading: creating } = useCreateJournalEntry()
  const { trigger: deleteEntry } = useDeleteJournalEntry()

  const [showCreate,   setShowCreate]   = useState(false)
  const [title,        setTitle]        = useState('')
  const [content,      setContent]      = useState('')
  const [mood,         setMood]         = useState(7)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => { void fetchEntries() }, [fetchEntries])

  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    const newEntry = await createEntry({ title: title.trim(), content: content.trim(), mood, energy: 7, tags: selectedTags })
    if (newEntry) {
      setEntries(prev => [newEntry, ...(prev ?? [])])
    }
    setTitle('')
    setContent('')
    setMood(7)
    setSelectedTags([])
    setShowCreate(false)
  }

  const handleDelete = async (id: string) => {
    const previousEntries = entries
    setEntries(previousEntries.filter(entry => entry.id !== id))

    if (!await deleteEntry({ id })) {
      setEntries(previousEntries)
    }
  }

  const avgMood = entries.length
    ? Math.round(entries.reduce((a, e) => a + e.mood, 0) / entries.length)
    : 0
  const allTags = [...new Set(entries.flatMap(e => e.tags))]

  if (loading && entries.length === 0) return <Layout><PageSkeleton /></Layout>
  if (error) return <Layout><PageError message={error} onRetry={() => void fetchEntries({ skipCache: true })} /></Layout>

  return (
    <Layout>
      <main className="app-page">
        <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
          <header className="app-header flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#D7FF35]">Private archive</p>
              <h1 className="text-4xl font-black leading-none tracking-[-0.055em] text-foreground sm:text-5xl">Journal</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} collected
              </p>
            </div>
            <Button
              className="pressable h-12 gap-2 rounded-2xl bg-[#D7FF35] px-5 font-bold text-[#151515] hover:bg-[#D7FF35]/85"
              onClick={() => setShowCreate(true)}
              aria-label="Write a new journal entry"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Write entry</span>
              <span className="sm:hidden">Write</span>
            </Button>
          </header>

          {entries.length > 0 && (
            <section className="surface-dark mt-8 grid grid-cols-3 overflow-hidden rounded-3xl" aria-label="Journal overview">
              <div className="px-4 py-5 sm:px-6">
                <p className="text-2xl font-black tabular-nums text-foreground sm:text-3xl">{entries.length}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Entries</p>
              </div>
              <div className="border-x border-white/10 px-4 py-5 sm:px-6">
                <p className="text-2xl leading-none sm:text-3xl" aria-label={`Average mood ${avgMood} out of 10`}>
                  {getMoodEmoji(avgMood)}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Avg mood</p>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="text-2xl font-black tabular-nums text-[#D7FF35] sm:text-3xl">{allTags.length}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Themes</p>
              </div>
            </section>
          )}

          {entries.length === 0 && !loading && (
            <section className="surface-paper mt-8 flex min-h-90 flex-col items-start justify-end rounded-4xl p-7 text-[#151515] sm:p-10">
              <BookOpen className="mb-auto h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
              <p className="max-w-sm text-3xl font-black leading-[0.95] tracking-[-0.045em]">A clear page for whatever today held.</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#151515]/65">Capture a thought, a lesson, or the detail you do not want to lose.</p>
              <Button className="pressable mt-7 rounded-2xl bg-[#151515] px-5 text-[#F4F4F0] hover:bg-[#292929]" onClick={() => setShowCreate(true)}>
                Write first entry
              </Button>
            </section>
          )}

          <section className="mt-8 space-y-4" aria-label="Journal entries">
            {entries.map(entry => {
              const entryDate = new Date(`${entry.entryDate}T00:00:00`)
              const day = entryDate.toLocaleDateString('en-US', { day: '2-digit' })
              const month = entryDate.toLocaleDateString('en-US', { month: 'short' })

              return (
                <article key={entry.id} className="surface-paper rounded-[28px] p-5 text-[#151515] sm:p-7">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <time className="shrink-0 border-r border-[#151515]/15 pr-4 text-center sm:pr-6" dateTime={entry.entryDate}>
                      <span className="block text-4xl font-black leading-none tracking-[-0.06em] tabular-nums sm:text-5xl">{day}</span>
                      <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#151515]/65">{month}</span>
                    </time>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl font-black leading-tight tracking-[-0.03em] sm:text-2xl">{entry.title}</h2>
                        <button
                          type="button"
                          onClick={() => void handleDelete(entry.id)}
                          className="icon-button pressable shrink-0 text-[#151515]/65 hover:bg-[#151515]/10 hover:text-[#9d2f25]"
                          aria-label={`Delete journal entry ${entry.title}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#151515]/70 line-clamp-4">{entry.content}</p>
                    </div>
                  </div>
                  <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#151515]/10 pt-4">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {entry.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="border-0 bg-transparent p-0 text-xs font-semibold text-[#151515]/65 shadow-none">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <span className="ml-auto flex items-center gap-2 text-xs font-bold tabular-nums" aria-label={`Mood ${entry.mood} out of 10`}>
                      <span className="text-lg" aria-hidden="true">{getMoodEmoji(entry.mood)}</span>
                      {entry.mood}/10
                    </span>
                  </footer>
                </article>
              )
            })}
          </section>
        </div>
      </main>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="surface-paper max-h-[90vh] max-w-md overflow-y-auto rounded-[28px] border-0 text-[#151515]">
          <DialogHeader><DialogTitle className="text-2xl font-black tracking-[-0.035em]">New entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <Input aria-label="Journal entry title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="h-12 rounded-2xl border-[#151515]/15 bg-transparent" />
            <Textarea
              aria-label="Journal entry content"
              placeholder="What's on your mind today?"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="min-h-35 rounded-2xl border-[#151515]/15 bg-transparent"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-[#151515]/65">Mood</p>
                <span className="text-sm font-bold">{MOOD_EMOJI[mood] ?? '😊'} {mood}/10</span>
              </div>
              <input
                aria-label="Mood rating from 1 to 10"
                type="range" min={1} max={10} value={mood}
                onChange={e => setMood(Number(e.target.value))}
                className="w-full accent-[#151515]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-[#151515]/65">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                    aria-label={`${selectedTags.includes(tag) ? 'Remove' : 'Add'} ${tag} tag`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedTags.includes(tag)
                        ? 'border-[#151515] bg-[#151515] text-[#F4F4F0] font-medium'
                        : 'border-[#151515]/20 text-[#151515]/65 hover:border-[#151515]/60'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <Button className="pressable h-12 w-full rounded-2xl bg-[#151515] text-[#F4F4F0] hover:bg-[#292929]" onClick={() => void handleCreate()} disabled={!title.trim() || !content.trim() || creating}>
              {creating ? 'Saving…' : 'Save entry'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

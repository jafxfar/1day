import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateJournalEntry, useDeleteJournalEntry, useGetJournalEntries } from '../entities/journal/model/useJournal'
import { JournalComposeDialog } from '../features/journal/JournalComposeDialog'
import { sanitizeJournalHtml } from '../features/journal/sanitizeJournalHtml'
import { Layout } from '../shared/ui/Layout'
import { PageSkeleton, PageError } from '../shared/ui/PageSkeleton'
import { Button } from '../shared/ui/button'
import { Badge } from '../shared/ui/badge'
import { Plus, BookOpen, Trash2 } from 'lucide-react'

const getMoodEmoji = (mood: number) => {
  if (mood >= 9) return '🤩'
  if (mood >= 7) return '😄'
  if (mood >= 5) return '🙂'
  if (mood >= 3) return '😐'
  return '😕'
}

export default function Journal() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: entries = [], setData: setEntries, loading, error, trigger: fetchEntries } = useGetJournalEntries()
  const { trigger: createEntry, loading: creating } = useCreateJournalEntry()
  const { trigger: deleteEntry } = useDeleteJournalEntry()

  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { void fetchEntries() }, [fetchEntries])

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      setShowCreate(true)
    }
  }, [searchParams])

  const handleCloseCreate = (open: boolean) => {
    setShowCreate(open)
    if (!open && searchParams.get('compose') === '1') {
      navigate('/journal', { replace: true })
    }
  }

  const handleCreate = async (payload: {
    title: string
    content: string
    mood: number
    energy: number
    tags: string[]
  }) => {
    const newEntry = await createEntry(payload)
    if (newEntry) {
      setEntries(prev => [newEntry, ...(prev ?? [])])
    }
    return newEntry
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
              const safeHtml = sanitizeJournalHtml(entry.content)
              const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(entry.content)

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
                      {looksLikeHtml ? (
                        <div
                          className="journal-entry-body mt-3 max-w-2xl text-sm leading-7 text-[#151515]/70"
                          dangerouslySetInnerHTML={{ __html: safeHtml }}
                        />
                      ) : (
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#151515]/70 line-clamp-4">
                          {entry.content}
                        </p>
                      )}
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

      <JournalComposeDialog
        open={showCreate}
        onOpenChange={handleCloseCreate}
        creating={creating}
        onCreate={handleCreate}
      />
    </Layout>
  )
}

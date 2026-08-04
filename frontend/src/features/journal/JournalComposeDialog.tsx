import { useEffect, useState } from 'react'
import { useEditor } from '@tiptap/react'
import type { JournalEntry } from '@life-os/contracts'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../shared/ui/dialog'
import { Button } from '../../shared/ui/button'
import { Input } from '../../shared/ui/input'
import { createJournalEditorExtensions } from './journalEditorExtensions'
import { JournalRichEditor } from './JournalRichEditor'
import { JournalMediaBar } from './JournalMediaBar'
import { isJournalContentEmpty, stripHtmlToText } from './mediaUtils'

const MOOD_EMOJI: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙁', 5: '😶',
  6: '🙂', 7: '😊', 8: '😄', 9: '🥰', 10: '🤩',
}

const TAG_OPTIONS = [
  'productive', 'happy', 'work', 'growth', 'rest', 'challenge',
  'family', 'focus', 'creative', 'nature', 'grateful', 'social', 'learning', 'inspired',
]

type JournalComposeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  creating: boolean
  onCreate: (payload: {
    title: string
    content: string
    mood: number
    energy: number
    tags: string[]
  }) => Promise<JournalEntry | null | undefined>
}

export const JournalComposeDialog = ({
  open,
  onOpenChange,
  creating,
  onCreate,
}: JournalComposeDialogProps) => {
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState(7)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contentTick, setContentTick] = useState(0)

  const editor = useEditor({
    extensions: createJournalEditorExtensions(),
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'outline-none min-h-44',
        'aria-label': 'Journal entry content',
      },
    },
    onUpdate: () => setContentTick(value => value + 1),
  })

  useEffect(() => {
    if (!open || !editor) return
    editor.commands.clearContent()
    setTitle('')
    setMood(7)
    setSelectedTags([])
    setContentTick(value => value + 1)
  }, [open, editor])

  const html = editor?.getHTML() ?? ''
  const isEmpty = isJournalContentEmpty(html)
  void contentTick

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag],
    )

  const handleSave = async () => {
    if (!editor || isEmpty || creating) return

    const body = editor.getHTML()
    const plain = stripHtmlToText(body)
    const entryTitle = title.trim() || plain.slice(0, 48) + (plain.length > 48 ? '…' : '') || 'Untitled'

    const created = await onCreate({
      title: entryTitle,
      content: body,
      mood,
      energy: 7,
      tags: selectedTags,
    })

    if (created) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="fixed inset-x-0 bottom-0 top-auto flex h-[92dvh] max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-[28px] rounded-b-none border-0 border-white/10 bg-[#1d1d1d] p-0 text-[#F4F4F0] sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px] sm:border"
      >
        <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-[#1d1d1d] px-5 py-4 sm:px-6">
          <DialogTitle className="text-left text-2xl font-black tracking-[-0.035em] text-[#F4F4F0]">
            Write entry
          </DialogTitle>
          <p className="text-left text-sm text-[#92928D]">
            Text, voice, images, and short video — kept with this note.
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6">
          <Input
            aria-label="Journal entry title (optional)"
            placeholder="Title (optional)"
            value={title}
            onChange={event => setTitle(event.target.value)}
            className="h-11 rounded-2xl"
          />

          <JournalRichEditor editor={editor} />
          <JournalMediaBar editor={editor} />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-[#92928D]">Mood</p>
              <span className="text-sm font-bold tabular-nums text-[#F4F4F0]">
                {MOOD_EMOJI[mood] ?? '😊'} {mood}/10
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mood from 1 to 10">
              {Array.from({ length: 10 }, (_, index) => {
                const value = index + 1
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMood(value)}
                    aria-pressed={mood === value}
                    aria-label={`Mood ${value}`}
                    className={`pressable flex size-9 items-center justify-center rounded-xl text-lg transition ${
                      mood === value
                        ? 'bg-[#292929] ring-2 ring-[#D7FF35]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span aria-hidden="true">{MOOD_EMOJI[value]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-[#92928D]">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTags.includes(tag)}
                  aria-label={`${selectedTags.includes(tag) ? 'Remove' : 'Add'} ${tag} tag`}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    selectedTags.includes(tag)
                      ? 'border-[#D7FF35] bg-[#D7FF35] font-medium text-[#151515]'
                      : 'border-white/15 text-[#92928D] hover:border-white/40 hover:text-[#F4F4F0]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-white/10 bg-[#1d1d1d] px-5 py-4 safe-bottom sm:px-6">
          <Button
            className="pressable h-12 w-full rounded-2xl bg-[#D7FF35] font-bold text-[#151515] hover:bg-[#D7FF35]/90"
            onClick={() => void handleSave()}
            disabled={isEmpty || creating}
          >
            {creating ? 'Saving…' : 'Save entry'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

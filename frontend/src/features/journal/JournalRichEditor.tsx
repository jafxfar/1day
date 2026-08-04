import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Type,
  Highlighter,
  Palette,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react'
import { cn } from '../../shared/lib/utils'
import {
  HIGHLIGHT_COLORS,
  JOURNAL_FONT_OPTIONS,
  TEXT_COLORS,
} from './journalEditorExtensions'

type JournalRichEditorProps = {
  editor: Editor | null
  className?: string
}

type ToolbarButtonProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  label: string
  children: ReactNode
}

const ToolbarButton = ({ onClick, active, disabled, label, children }: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    aria-pressed={active}
    className={cn(
      'pressable flex size-8 shrink-0 items-center justify-center rounded-lg text-[#F4F4F0]/70 transition hover:bg-white/8 hover:text-[#F4F4F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]/40 disabled:opacity-40',
      active && 'bg-white/15 text-[#D7FF35] hover:bg-white/20 hover:text-[#D7FF35]',
    )}
  >
    {children}
  </button>
)

type ColorPopoverProps = {
  label: string
  icon: ReactNode
  colors: readonly string[]
  onPick: (color: string) => void
  clearLabel?: string
  onClear?: () => void
}

const ColorPopover = ({ label, icon, colors, onPick, clearLabel, onClear }: ColorPopoverProps) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        className="pressable flex h-8 items-center gap-1 rounded-lg px-1.5 text-[#F4F4F0]/70 transition hover:bg-white/8 hover:text-[#F4F4F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]/40"
      >
        {icon}
        <ChevronDown className="size-3" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-1 flex w-max flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#292929] p-2 shadow-lg"
        >
          {colors.map(color => (
            <button
              key={color}
              type="button"
              role="option"
              aria-label={`Use color ${color}`}
              onClick={() => {
                onPick(color)
                setOpen(false)
              }}
              className="size-6 rounded-md border border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF35]/40"
              style={{
                background: color === 'transparent'
                  ? 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 50% / 8px 8px'
                  : color,
              }}
            />
          ))}
          {onClear && clearLabel && (
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="h-6 rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide text-[#92928D] hover:bg-white/8 hover:text-[#F4F4F0]"
            >
              {clearLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const JournalEditorToolbar = ({ editor }: { editor: Editor }) => {
  const fontValue = editor.getAttributes('textStyle').fontFamily as string | undefined

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-white/10 pb-2"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" aria-hidden="true" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-white/12" aria-hidden="true" />

      <ColorPopover
        label="Text color"
        icon={<Palette className="size-4" aria-hidden="true" />}
        colors={TEXT_COLORS}
        onPick={color => editor.chain().focus().setColor(color).run()}
        clearLabel="Reset"
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <ColorPopover
        label="Highlight color"
        icon={<Highlighter className="size-4" aria-hidden="true" />}
        colors={HIGHLIGHT_COLORS}
        onPick={color => {
          if (color === 'transparent') {
            editor.chain().focus().unsetHighlight().run()
            return
          }
          editor.chain().focus().toggleHighlight({ color }).run()
        }}
        clearLabel="Clear"
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      <label className="relative ml-0.5 flex h-8 items-center gap-1 rounded-lg px-1.5 text-[#F4F4F0]/70 hover:bg-white/8">
        <Type className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Font family</span>
        <select
          aria-label="Font family"
          value={fontValue ?? ''}
          onChange={event => {
            const value = event.target.value
            if (!value) {
              editor.chain().focus().unsetFontFamily().run()
              return
            }
            editor.chain().focus().setFontFamily(value).run()
          }}
          className="max-w-24 cursor-pointer appearance-none bg-transparent text-xs font-medium text-[#F4F4F0] outline-none"
        >
          <option value="">Default</option>
          {JOURNAL_FONT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <span className="mx-1 h-5 w-px bg-white/12" aria-hidden="true" />

      <ToolbarButton
        label="Align left"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Justify"
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify className="size-4" aria-hidden="true" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-white/12" aria-hidden="true" />

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" aria-hidden="true" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-white/12" aria-hidden="true" />

      <ToolbarButton
        label="Insert table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon className="size-4" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Add table row"
        disabled={!editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Delete table row"
        disabled={!editor.can().deleteRow()}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
    </div>
  )
}

export const JournalRichEditor = ({ editor, className }: JournalRichEditorProps) => {
  if (!editor) {
    return (
      <div className={cn('min-h-48 animate-pulse rounded-2xl bg-white/5', className)} aria-hidden="true" />
    )
  }

  return (
    <div className={cn('journal-editor flex flex-col gap-2', className)}>
      <JournalEditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="journal-editor-content min-h-48 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-base leading-relaxed text-[#F4F4F0] focus-within:border-white/25"
      />
    </div>
  )
}

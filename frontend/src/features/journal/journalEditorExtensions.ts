import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import { JournalAudio, JournalVideo } from './mediaNodes'

export const JOURNAL_FONT_OPTIONS = [
  { label: 'Manrope', value: 'Manrope Variable, Avenir Next, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: 'Courier New, monospace' },
  { label: 'System', value: 'system-ui, sans-serif' },
] as const

export const TEXT_COLORS = [
  '#151515',
  '#9d2f25',
  '#1d5c3a',
  '#1a4a8a',
  '#7a4a12',
  '#6b2d8b',
  '#92928D',
] as const

export const HIGHLIGHT_COLORS = [
  '#D7FF35',
  '#ffe566',
  '#ffb4a8',
  '#a8e6cf',
  '#a8d4ff',
  '#e8d4ff',
  'transparent',
] as const

export const createJournalEditorExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  FontFamily,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  TableKit.configure({
    table: { resizable: false },
  }),
  Image.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: 'journal-editor-image',
    },
  }),
  Underline,
  JournalAudio,
  JournalVideo,
]

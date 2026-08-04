import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col',
  'img', 'audio', 'video',
  'a', 'blockquote', 'div',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'controls', 'style',
  'colspan', 'rowspan', 'class',
]

export const sanitizeJournalHtml = (dirty: string) =>
  DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })

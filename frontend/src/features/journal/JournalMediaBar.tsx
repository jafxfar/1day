import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import type { Editor } from '@tiptap/react'
import { Image as ImageIcon, Mic, Square, Video, X } from 'lucide-react'
import { cn } from '../../shared/lib/utils'
import {
  blobToDataUrl,
  compressImageFile,
  formatBytes,
  MAX_AUDIO_BYTES,
  MAX_VIDEO_BYTES,
} from './mediaUtils'

type PendingAttachment = {
  id: string
  kind: 'image' | 'audio' | 'video'
  previewUrl: string
  label: string
}

type JournalMediaBarProps = {
  editor: Editor | null
  className?: string
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `media-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const JournalMediaBar = ({ editor, className }: JournalMediaBarProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    attachments.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl)
    })
  }, [])

  const pushAttachment = (item: PendingAttachment) => {
    setAttachments(prev => [...prev, item])
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const target = prev.find(item => item.id === id)
      if (target?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl)
      return prev.filter(item => item.id !== id)
    })
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return

    setBusy(true)
    setError(null)
    try {
      const dataUrl = await compressImageFile(file)
      editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
      pushAttachment({
        id: createId(),
        kind: 'image',
        previewUrl: dataUrl,
        label: file.name || 'Image',
      })
    } catch {
      setError('Could not process image')
    } finally {
      setBusy(false)
    }
  }

  const handleVideoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !editor) return

    if (file.size > MAX_VIDEO_BYTES) {
      setError(`Video is too large (${formatBytes(file.size)}). Max ${formatBytes(MAX_VIDEO_BYTES)} without cloud storage.`)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const dataUrl = await blobToDataUrl(file)
      editor.chain().focus().insertContent({
        type: 'journalVideo',
        attrs: { src: dataUrl },
      }).run()
      const previewUrl = URL.createObjectURL(file)
      pushAttachment({
        id: createId(),
        kind: 'video',
        previewUrl,
        label: file.name || 'Video',
      })
    } catch {
      setError('Could not process video')
    } finally {
      setBusy(false)
    }
  }

  const handleStopRecording = () => {
    recorderRef.current?.stop()
  }

  const handleStartRecording = async () => {
    if (!editor || recording) return
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not available in this browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      recorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        setRecording(false)

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        chunksRef.current = []

        if (blob.size > MAX_AUDIO_BYTES) {
          setError(`Voice note is too large (${formatBytes(blob.size)}). Max ${formatBytes(MAX_AUDIO_BYTES)}.`)
          return
        }

        try {
          const dataUrl = await blobToDataUrl(blob)
          editor.chain().focus().insertContent({
            type: 'journalAudio',
            attrs: { src: dataUrl },
          }).run()
          const previewUrl = URL.createObjectURL(blob)
          pushAttachment({
            id: createId(),
            kind: 'audio',
            previewUrl,
            label: 'Voice note',
          })
        } catch {
          setError('Could not save voice note')
        }
      }

      recorder.start()
      setRecording(true)
    } catch {
      setError('Microphone permission denied')
    }
  }

  const handleToggleRecording = () => {
    if (recording) {
      handleStopRecording()
      return
    }
    void handleStartRecording()
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={event => void handleImageChange(event)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={event => void handleVideoChange(event)}
        />

        <button
          type="button"
          disabled={!editor || busy}
          onClick={() => imageInputRef.current?.click()}
          aria-label="Add image"
          className="pressable inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-semibold text-[#F4F4F0] transition hover:bg-white/8 disabled:opacity-40"
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          Image
        </button>

        <button
          type="button"
          disabled={!editor || busy}
          onClick={handleToggleRecording}
          aria-label={recording ? 'Stop voice recording' : 'Record voice note'}
          aria-pressed={recording}
          className={cn(
            'pressable inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:opacity-40',
            recording
              ? 'border-[#9d2f25] bg-[#9d2f25] text-[#F4F4F0]'
              : 'border-white/15 text-[#F4F4F0] hover:bg-white/8',
          )}
        >
          {recording
            ? <Square className="size-4" aria-hidden="true" />
            : <Mic className="size-4" aria-hidden="true" />}
          {recording ? 'Stop' : 'Voice'}
        </button>

        <button
          type="button"
          disabled={!editor || busy}
          onClick={() => videoInputRef.current?.click()}
          aria-label="Add video"
          className="pressable inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm font-semibold text-[#F4F4F0] transition hover:bg-white/8 disabled:opacity-40"
        >
          <Video className="size-4" aria-hidden="true" />
          Video
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-300">
          {error}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Attached media">
          {attachments.map(item => (
            <li
              key={item.id}
              className="relative shrink-0 overflow-hidden rounded-xl border border-white/12 bg-white/6"
            >
              {item.kind === 'image' && (
                <img src={item.previewUrl} alt={item.label} className="h-16 w-16 object-cover" />
              )}
              {item.kind === 'audio' && (
                <div className="flex h-16 w-40 flex-col justify-center gap-1 px-2">
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#92928D]">
                    {item.label}
                  </p>
                  <audio src={item.previewUrl} controls className="h-7 w-full" />
                </div>
              )}
              {item.kind === 'video' && (
                <video src={item.previewUrl} className="h-16 w-24 object-cover" muted />
              )}
              <button
                type="button"
                onClick={() => handleRemoveAttachment(item.id)}
                aria-label={`Remove ${item.label}`}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-[#F4F4F0]"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

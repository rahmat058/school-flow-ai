import { Paperclip, SendHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export function MessageComposer() {
  return (
    <div className="border-line flex shrink-0 items-center gap-2 border-t p-4">
      <button
        type="button"
        aria-disabled="true"
        aria-label="Attach a file"
        title="Attachments are not connected yet"
        className="text-ink-muted hover:bg-primary-soft hover:text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors">
        <Paperclip className="size-4.5" strokeWidth={1.75} />
      </button>

      <Input placeholder="Type a message…" aria-label="Message" className="h-11 rounded-full" />

      <button
        type="button"
        aria-disabled="true"
        aria-label="Send message"
        title="Sending arrives with the chat module"
        className="bg-primary inline-flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-(--shadow-primary)">
        <SendHorizontal className="size-4.5" strokeWidth={1.75} />
      </button>
    </div>
  )
}

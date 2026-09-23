import { useState } from 'react'
import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/hooks/useToast'

interface StudentTabHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

/** Title on the left, an optional action on the right — how every profile tab opens. */
export function StudentTabHeader({ title, description, action }: StudentTabHeaderProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">{title}</h2>
        <p className="text-ink-muted mt-1 text-[13px]">{description}</p>
      </div>

      {action}
    </section>
  )
}

interface DownloadSheetButtonProps {
  label: string
  /** Builds and downloads the sheet — the caller imports the PDF module inside this. */
  run: () => Promise<void>
  disabled?: boolean
  disabledReason?: string
}

/**
 * The one download control. The PDF renderer is pulled in by the caller's dynamic import, so this
 * button stays cheap and the renderer only loads when someone actually asks for a sheet.
 */
export function DownloadSheetButton({ label, run, disabled = false, disabledReason }: DownloadSheetButtonProps) {
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)

  async function handleClick() {
    setGenerating(true)

    try {
      await run()
      toast({ tone: 'success', title: 'PDF downloaded' })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not build the PDF',
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      disabled={generating || disabled}
      title={disabled ? disabledReason : undefined}>
      {generating ? <Spinner size="sm" label="Building the PDF" /> : <Download className="size-4" strokeWidth={1.75} />}
      {label}
    </Button>
  )
}

import { useState } from 'react'
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { usePermissionCatalogue, useSaveUserPermissions, useUserPermissions } from '@/features/permissions/api'

interface PermissionEditorProps {
  userId: string | null
  onBack: () => void
  className?: string
}

export function PermissionEditor({ userId, onBack, className }: PermissionEditorProps) {
  const { toast } = useToast()
  const catalogue = usePermissionCatalogue()
  const account = useUserPermissions(userId)
  const save = useSaveUserPermissions()
  // Null while the editor still follows the saved set; a Set once a toggle has been made.
  const [draft, setDraft] = useState<Set<string> | null>(null)

  const saved = new Set(account.data?.grantedKeys ?? [])
  const active = draft ?? saved

  function toggle(key: string, checked: boolean) {
    const next = new Set(active)
    if (checked) next.add(key)
    else next.delete(key)
    setDraft(next)
  }

  async function handleSave() {
    if (!userId) return

    const keys = [...active]

    try {
      await save.mutateAsync({ userId, input: { keys } })
      setDraft(null)
      toast({
        tone: 'success',
        title: 'Permissions saved',
        description: `${keys.length} active for ${account.data?.name ?? 'this teacher'}.`,
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not save permissions',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  if (!userId) {
    return (
      <div className={cn('flex min-w-0 flex-1 items-center justify-center p-6', className)}>
        <EmptyState
          icon={ShieldCheck}
          title="Pick a teacher"
          description="Choose someone from the list to review their permissions."
          className="w-full max-w-sm"
        />
      </div>
    )
  }

  const loading = account.isPending || catalogue.isPending

  return (
    <div className={cn('min-w-0 flex-1', className)}>
      <div className="flex h-full flex-col">
        <header className="border-line flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to staff"
              className="text-ink-muted hover:bg-primary-soft hover:text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors lg:hidden">
              <ArrowLeft className="size-4.5" strokeWidth={1.75} />
            </button>

            <div className="min-w-0">
              <p className="text-ink truncate text-[16px] font-semibold">{account.data?.name ?? 'Loading…'}</p>
              <p className="text-ink-subtle truncate text-[12.5px]">{account.data?.email ?? ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-primary text-[13px] font-medium">{active.size} active</span>
            <Button onClick={handleSave} disabled={save.isPending || loading}>
              {save.isPending ? (
                <Spinner size="sm" className="text-white" label="Saving" />
              ) : (
                <Save className="size-4" strokeWidth={1.75} />
              )}
              Save
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-5" aria-busy="true">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {(catalogue.data ?? []).map((group) => (
                <section
                  key={group.group}
                  className="border-line divide-line divide-y overflow-hidden rounded-xl border">
                  <h2 className="bg-canvas text-ink-subtle px-4 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase">
                    {humanizeEnum(group.group)}
                  </h2>

                  {group.permissions.map((permission) => (
                    <Switch
                      key={permission.key}
                      className="w-full flex-row-reverse items-center justify-between gap-3 px-4 py-3"
                      label={permission.label}
                      checked={active.has(permission.key)}
                      onCheckedChange={(checked) => toggle(permission.key, checked)}
                    />
                  ))}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Database, ShieldCheck } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCreateBackup, useUpdateSchoolSettings } from '@/features/school/api'
import type { School, SecuritySettings } from '@/types/school'

interface SecurityTabProps {
  formId: string
  school: School
}

/** Session limits, two-factor sign-in and the manual backup action. */
export function SecurityTab({ formId, school }: SecurityTabProps) {
  const { toast } = useToast()
  const updateSettings = useUpdateSchoolSettings()
  const createBackup = useCreateBackup()
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<SecuritySettings>({
    mode: 'onTouched',
    defaultValues: school.settings.security,
  })

  const onSubmit: SubmitHandler<SecuritySettings> = async (values) => {
    try {
      await updateSettings.mutateAsync({ security: values })
      toast({ tone: 'success', title: 'Security settings saved' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save the security settings'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  async function createBackupNow() {
    try {
      const job = await createBackup.mutateAsync()
      toast({
        tone: 'success',
        title: 'Backup created',
        description: `${Math.round(job.sizeBytes / (1024 * 1024))} MB snapshot is ready.`,
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Backup failed',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-canvas text-ink-subtle inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ShieldCheck className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">
              Security &amp; Backup
            </h2>
            <p className="text-ink-muted mt-0.5 text-[13px]">Sign-in limits and a snapshot of the school's data.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Session Timeout (minutes)"
            type="number"
            min={5}
            max={240}
            error={errors.sessionTimeoutMinutes?.message}
            {...register('sessionTimeoutMinutes', {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value >= 5 && value <= 240) || 'Enter between 5 and 240 minutes',
            })}
          />
          <Input
            label="Max Login Attempts"
            type="number"
            min={1}
            max={10}
            error={errors.maxLoginAttempts?.message}
            {...register('maxLoginAttempts', {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isInteger(value) && value >= 1 && value <= 10) || 'Enter between 1 and 10 attempts',
            })}
          />
        </div>

        <div className="border-line mt-5 border-t pt-4">
          <Controller
            control={control}
            name="twoFactorEnabled"
            render={({ field }) => (
              <Switch
                id="twoFactorEnabled"
                label="Two-Factor Authentication"
                description="Add an extra layer of security"
                checked={field.value}
                onCheckedChange={field.onChange}
                className="w-full flex-row-reverse items-center justify-between"
              />
            )}
          />
        </div>

        <div className="border-line mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-ink text-[14px] font-medium">Manual backup</p>
            <p className="text-ink-muted mt-0.5 text-[13px]">Create a snapshot of your school's data on demand.</p>
          </div>

          <Button variant="secondary" onClick={createBackupNow} disabled={createBackup.isPending}>
            {createBackup.isPending ? (
              <Spinner size="sm" label="Creating backup" />
            ) : (
              <Database className="size-4" strokeWidth={1.75} />
            )}
            Create Backup
          </Button>
        </div>
      </article>
    </form>
  )
}

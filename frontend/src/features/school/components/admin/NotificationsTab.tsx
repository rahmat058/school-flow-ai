import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Bell } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useUpdateSchoolSettings } from '@/features/school/api'
import type { NotificationSettings, School } from '@/types/school'

const TOGGLES: Array<{ name: keyof NotificationSettings; label: string; description: string }> = [
  { name: 'emailAlerts', label: 'Email Alerts', description: 'Receive notifications via email' },
  { name: 'smsAlerts', label: 'SMS Alerts', description: 'Receive notifications via SMS' },
  {
    name: 'attendanceAlerts',
    label: 'Attendance Alerts',
    description: 'Get notified when attendance is below threshold',
  },
  { name: 'feeReminders', label: 'Fee Reminders', description: 'Send automatic fee payment reminders' },
  {
    name: 'examNotifications',
    label: 'Exam Notifications',
    description: 'Notify students and parents about upcoming exams',
  },
]

interface NotificationsTabProps {
  formId: string
  school: School
}

/** The school-wide notification switches. */
export function NotificationsTab({ formId, school }: NotificationsTabProps) {
  const { toast } = useToast()
  const updateSettings = useUpdateSchoolSettings()
  const {
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<NotificationSettings>({
    mode: 'onTouched',
    defaultValues: school.settings.notifications,
  })

  const onSubmit: SubmitHandler<NotificationSettings> = async (values) => {
    try {
      await updateSettings.mutateAsync({ notifications: values })
      toast({ tone: 'success', title: 'Notification preferences saved' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save the notification preferences'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

      <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
        <div className="flex items-start gap-3">
          <span className="bg-canvas text-ink-subtle inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Bell className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">
              Notification Preferences
            </h2>
            <p className="text-ink-muted mt-0.5 text-[13px]">Choose what the school sends out and where.</p>
          </div>
        </div>

        <ul className="divide-line mt-4 divide-y">
          {TOGGLES.map((toggle) => (
            <li key={toggle.name} className="py-3.5">
              <Controller
                control={control}
                name={toggle.name}
                render={({ field }) => (
                  <Switch
                    id={toggle.name}
                    label={toggle.label}
                    description={toggle.description}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="w-full flex-row-reverse items-center justify-between"
                  />
                )}
              />
            </li>
          ))}
        </ul>
      </article>
    </form>
  )
}

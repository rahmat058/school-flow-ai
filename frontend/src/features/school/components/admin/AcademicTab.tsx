import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Settings2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useUpdateSchoolSettings } from '@/features/school/api'
import { academicYearOptions, gradingScaleOptions, termStructureOptions } from '@/lib/options'
import type { GradingScale, School, TermStructure } from '@/types/school'

interface AcademicFormValues {
  academicYear: string
  gradingScale: GradingScale
  termStructure: TermStructure
  passPercentage: number
}

interface AcademicTabProps {
  formId: string
  school: School
}

/** Academic year, grading scale, term structure and the pass mark. */
export function AcademicTab({ formId, school }: AcademicTabProps) {
  const { toast } = useToast()
  const updateSettings = useUpdateSchoolSettings()
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<AcademicFormValues>({
    mode: 'onTouched',
    defaultValues: {
      academicYear: school.settings.academicYear,
      gradingScale: school.settings.gradingScale,
      termStructure: school.settings.termStructure,
      passPercentage: school.settings.passPercentage,
    },
  })

  const onSubmit: SubmitHandler<AcademicFormValues> = async (values) => {
    try {
      await updateSettings.mutateAsync(values)
      toast({ tone: 'success', title: 'Academic settings saved' })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save the academic settings'
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
            <Settings2 className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">
              Academic Configuration
            </h2>
            <p className="text-ink-muted mt-0.5 text-[13px]">The year, term structure and grading used school-wide.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="academicYear"
            rules={{ required: 'Choose an academic year' }}
            render={({ field }) => (
              <Select
                label="Academic Year"
                options={academicYearOptions(school.settings.academicYear)}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.academicYear?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="gradingScale"
            render={({ field }) => (
              <Select
                label="Grading Scale"
                options={gradingScaleOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.gradingScale?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="termStructure"
            render={({ field }) => (
              <Select
                label="Term Structure"
                options={termStructureOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.termStructure?.message}
              />
            )}
          />

          <Input
            label="Pass Percentage"
            type="number"
            min={0}
            max={100}
            error={errors.passPercentage?.message}
            {...register('passPercentage', {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value >= 0 && value <= 100) || 'Enter a percentage between 0 and 100',
            })}
          />
        </div>
      </article>
    </form>
  )
}

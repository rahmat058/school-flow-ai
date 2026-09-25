import { useId, useRef } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { FileUp, Upload } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { formatBytes } from '@/lib/format'
import { materialTypeOptions } from '@/lib/options'
import { MATERIAL_ACCEPT, materialFileError } from '@/lib/validation'
import { useClassOptions } from '@/features/classes/api'
import { useUploadMaterial } from '@/features/materials/api'
import { useSubjects } from '@/features/subjects/api'
import type { MaterialType, MaterialUpload } from '@/types/materials'

interface MaterialFormSheetProps {
  open: boolean
  onClose: () => void
}

interface FormValues {
  classId: string
  subjectId: string
  type: MaterialType | ''
  title: string
  description: string
  file: FileList | null
}

/**
 * Upload is create-only — the contract has no `PATCH /materials/:id`, so a stored file's metadata is
 * not editable. The parent keys the sheet so a new upload always mounts clean.
 */
export function MaterialFormSheet({ open, onClose }: MaterialFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const fileInput = useRef<HTMLInputElement | null>(null)
  const classOptions = useClassOptions()
  const uploadMaterial = useUploadMaterial()

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { classId: '', subjectId: '', type: '', title: '', description: '', file: null },
    mode: 'onTouched',
  })

  // Subjects belong to a class, so the list cannot be offered until one is chosen.
  const classId = useWatch({ control, name: 'classId' })
  const subjects = useSubjects(classId ? { classId } : {})
  const subjectOptions = classId
    ? (subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name }))
    : []

  const picked = useWatch({ control, name: 'file' })?.[0] ?? null

  const { ref: registerFileRef, ...fileField } = register('file', {
    validate: (files) => materialFileError(files?.[0] ?? null) ?? true,
  })

  const classSelectOptions = [
    { value: '', label: 'Choose a class' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const file = values.file?.[0]
    const fileError = materialFileError(file)

    if (fileError || !file) {
      setError('file', { type: 'validate', message: fileError ?? 'Choose a file to upload' })
      return
    }

    const upload: MaterialUpload = {
      classId: values.classId,
      subjectId: values.subjectId,
      type: values.type as MaterialType,
      title: values.title.trim(),
      description: values.description.trim() || null,
      file,
    }

    try {
      await uploadMaterial.mutateAsync(upload)
      toast({
        tone: 'success',
        title: `${upload.title} uploaded`,
        description: 'Students in the class can open it now.',
      })
      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not upload this material'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Upload failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Upload study material"
      description="Share notes, worksheets, papers or a PDF with one class."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Uploading" /> : null}
            Upload material
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Controller
          control={control}
          name="classId"
          rules={{ required: 'Choose a class' }}
          render={({ field }) => (
            <Select
              label="Class"
              options={classSelectOptions}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value)
                // The chosen subject may not be taught in the new class.
                setValue('subjectId', '')
              }}
              error={errors.classId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="subjectId"
          rules={{ required: 'Choose a subject' }}
          render={({ field }) => (
            <Select
              label="Subject"
              options={subjectOptions}
              placeholder={classId ? 'Select subject…' : 'Select a class first…'}
              value={field.value}
              onValueChange={field.onChange}
              disabled={!classId || subjects.isPending}
              error={errors.subjectId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="type"
          rules={{ required: 'Choose a material type' }}
          render={({ field }) => (
            <Select
              label="Type"
              options={materialTypeOptions}
              placeholder="Select type…"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.type?.message}
            />
          )}
        />

        <Input
          label="Title"
          placeholder="e.g. Chapter 5 — revision notes"
          error={errors.title?.message}
          {...register('title', { required: 'A title is required' })}
        />

        <Textarea
          label="Description"
          rows={3}
          placeholder="What the file covers, how it should be used…"
          error={errors.description?.message}
          {...register('description')}
        />

        <div>
          <span className="text-ink mb-1.5 block text-[13px] font-medium">File</span>

          <input
            {...fileField}
            ref={(element) => {
              registerFileRef(element)
              fileInput.current = element
            }}
            type="file"
            className="hidden"
            accept={MATERIAL_ACCEPT}
            aria-label="Choose a file to upload"
          />

          <div className="border-line bg-canvas flex items-center gap-3 rounded-md border border-dashed p-3">
            <span className="bg-surface text-ink-subtle inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
              <FileUp className="size-4" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-[13px] font-medium">{picked ? picked.name : 'No file chosen'}</p>
              <p className="text-ink-subtle text-[12px]">
                {picked ? formatBytes(picked.size) : 'PDF, JPG, PNG or DOCX up to 10MB.'}
              </p>
            </div>

            <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="size-3.5" strokeWidth={1.75} />
              {picked ? 'Replace' : 'Choose file'}
            </Button>
          </div>

          {errors.file?.message ? <p className="text-error mt-1.5 text-[12px]">{errors.file.message}</p> : null}
        </div>
      </form>
    </Sheet>
  )
}

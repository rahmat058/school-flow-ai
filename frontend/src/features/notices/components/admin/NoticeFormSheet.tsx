import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { noticePriorityOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import { useCreateNotice, useUpdateNotice } from '@/features/notices/api'
import type { Notice, NoticeInput, NoticePriority } from '@/types/communication'

interface NoticeFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null publishes a new notice; a card edits that one. */
  notice: Notice | null
}

interface FormValues {
  title: string
  body: string
  priority: string
  authorName: string
}

export function NoticeFormSheet({ open, onClose, notice }: NoticeFormSheetProps) {
  const { toast } = useToast()
  const user = useCurrentUser()
  const formId = useId()
  const createNotice = useCreateNotice()
  const updateNotice = useUpdateNotice()
  const editing = notice !== null
  // The byline defaults to the signed-in publisher; the API falls back to it when the field is blank.
  const defaultAuthor = user ? `${user.firstName} ${user.lastName}`.trim() : ''

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: notice?.title ?? '',
      body: notice?.body ?? '',
      priority: notice?.priority ?? 'MEDIUM',
      authorName: notice?.authorName ?? defaultAuthor,
    },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: NoticeInput = {
      title: values.title.trim(),
      body: values.body.trim(),
      priority: values.priority as NoticePriority,
      authorName: values.authorName.trim(),
    }

    try {
      if (notice) {
        await updateNotice.mutateAsync({ id: notice.id, input })
        toast({ tone: 'success', title: 'Notice updated' })
      } else {
        await createNotice.mutateAsync(input)
        toast({ tone: 'success', title: 'Notice published', description: 'It appears at the top of the board.' })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this notice'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit notice' : 'New notice'}
      description={editing ? 'Update this announcement on the board.' : 'Publish an announcement to the whole school.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Publish notice'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <Input
          label="Title"
          placeholder="Notice title"
          error={errors.title?.message}
          {...register('title', { required: 'A title is required' })}
        />

        <Textarea
          label="Description"
          rows={4}
          placeholder="Write notice details…"
          error={errors.body?.message}
          {...register('body', { required: 'A description is required' })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="priority"
            rules={{ required: 'Choose a priority' }}
            render={({ field }) => (
              <Select
                label="Priority"
                options={noticePriorityOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.priority?.message}
              />
            )}
          />

          <Input
            label="Author"
            placeholder="Author name"
            hint="Blank uses your name."
            error={errors.authorName?.message}
            {...register('authorName')}
          />
        </div>
      </form>
    </Sheet>
  )
}

import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { X } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Select } from '@/components/ui/Select'
import { Sheet } from '@/components/ui/Sheet'
import { Spinner } from '@/components/ui/Spinner'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/hooks/useToast'
import { env } from '@/lib/env'
import { parentRelationOptions, recordStatusOptions } from '@/lib/options'
import { emailRules, phoneRules } from '@/lib/validation'
import { ApiError } from '@/services/apiClient'
import { useStudentOptions } from '@/features/students/api'
import { StudentSearchInput } from '@/features/students/components/admin/StudentSearchInput'
import { useCreateParent, useUpdateParent } from '@/features/parents/api'
import type { ParentInput, ParentListItem, ParentRelation, RecordStatus } from '@/types/people'

interface ParentFormSheetProps {
  open: boolean
  onClose: () => void
  /** Null creates a parent; a row edits that one. */
  parent: ParentListItem | null
}

interface FormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  occupation: string
  status: string
}

/** One child held in the form before the parent is saved — the student picker's own working shape. */
interface LinkDraft {
  studentId: string
  label: string
  relation: ParentRelation
  isPrimary: boolean
}

/**
 * Create and edit share one form. The sheet is keyed on the target parent, so it mounts with that
 * parent's values and the linked children it already has, and never carries a previous edit across.
 */
export function ParentFormSheet({ open, onClose, parent }: ParentFormSheetProps) {
  const { toast } = useToast()
  const formId = useId()
  const students = useStudentOptions()
  const createParent = useCreateParent()
  const updateParent = useUpdateParent()
  const editing = parent !== null

  const [links, setLinks] = useState<LinkDraft[]>(
    parent?.children.map((child) => ({
      studentId: child.id,
      label: `${child.name} (${child.className})`,
      relation: child.relation,
      isPrimary: child.isPrimary,
    })) ?? [],
  )

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: parent?.firstName ?? '',
      lastName: parent?.lastName ?? '',
      email: parent?.email ?? '',
      phone: parent?.phone ?? '',
      address: parent?.address ?? '',
      occupation: parent?.occupation ?? '',
      status: parent?.status ?? 'ACTIVE',
    },
    mode: 'onTouched',
  })

  function addStudent(studentId: string) {
    if (links.some((link) => link.studentId === studentId)) return

    const option = (students.data ?? []).find((item) => item.value === studentId)
    setLinks((current) => [
      ...current,
      { studentId, label: option?.label ?? studentId, relation: 'GUARDIAN', isPrimary: false },
    ])
  }

  function updateLink(studentId: string, patch: Partial<LinkDraft>) {
    setLinks((current) => current.map((link) => (link.studentId === studentId ? { ...link, ...patch } : link)))
  }

  function removeLink(studentId: string) {
    setLinks((current) => current.filter((link) => link.studentId !== studentId))
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const input: ParentInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      address: values.address.trim() || null,
      occupation: values.occupation.trim() || null,
      status: values.status as RecordStatus,
      links: links.map((link) => ({
        studentId: link.studentId,
        relation: link.relation,
        isPrimary: link.isPrimary,
      })),
    }

    try {
      if (parent) {
        await updateParent.mutateAsync({ id: parent.id, input })
        toast({ tone: 'success', title: `${input.firstName} ${input.lastName} updated` })
      } else {
        const created = await createParent.mutateAsync(input)
        const invite = created.invite
        // The login is created with the record; the password goes out by email, so in mock mode
        // (where there is no inbox) it is shown here instead.
        const demoPassword =
          env.enableMocks && invite?.mockOnlyPassword ? ` · demo password ${invite.mockOnlyPassword}` : ''

        toast({
          tone: 'success',
          title: `${input.firstName} ${input.lastName} added`,
          description: invite
            ? `Verification email sent to ${invite.email}${demoPassword} — the login unlocks once it is confirmed.`
            : 'They can sign in once an admin shares their credentials.',
        })
      }

      onClose()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not save this parent'
      setError('root.serverError', { type: 'server', message })
      toast({ tone: 'error', title: 'Save failed', description: message })
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit parent' : 'Add parent'}
      description={
        editing
          ? `Update the record for ${parent?.firstName} ${parent?.lastName}.`
          : 'Add a guardian and link the students they are responsible for.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="text-white" label="Saving" /> : null}
            {editing ? 'Save changes' : 'Add parent'}
          </Button>
        </>
      }>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {errors.root?.serverError ? <Alert tone="error" title={errors.root.serverError.message} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            placeholder="Rahim"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required' })}
          />
          <Input
            label="Last name"
            placeholder="Khan"
            error={errors.lastName?.message}
            {...register('lastName', { required: 'Last name is required' })}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="parent@example.com"
          hint="Their sign-in address — the invite and its password go here."
          error={errors.email?.message}
          {...register('email', emailRules)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="phone"
            rules={phoneRules}
            render={({ field, fieldState }) => (
              <PhoneInput
                label="Phone"
                placeholder="1712345678"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Input
            label="Occupation"
            placeholder="Software engineer"
            error={errors.occupation?.message}
            {...register('occupation')}
          />
        </div>

        <Textarea label="Address" rows={2} placeholder="House, road, area" {...register('address')} />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              label="Status"
              options={recordStatusOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.status?.message}
            />
          )}
        />

        <div className="border-line space-y-4 border-t pt-5">
          <div>
            <h3 className="text-ink text-[14px] font-medium">Linked students</h3>
            <p className="text-ink-muted mt-0.5 text-[12px]">
              Search the roster and add each student this guardian is responsible for.
            </p>
          </div>

          <StudentSearchInput label="Add a student" onSelect={addStudent} />

          {links.length > 0 ? (
            <ul className="space-y-2.5">
              {links.map((link) => (
                <li
                  key={link.studentId}
                  className="border-line bg-canvas/40 flex flex-wrap items-center gap-3 rounded-lg border p-3">
                  <span className="text-ink min-w-0 flex-1 truncate text-[14px]">{link.label}</span>

                  <div className="w-32 shrink-0">
                    <Select
                      options={parentRelationOptions}
                      value={link.relation}
                      onValueChange={(value) => updateLink(link.studentId, { relation: value as ParentRelation })}
                    />
                  </div>

                  <Switch
                    size="sm"
                    checked={link.isPrimary}
                    onCheckedChange={(checked) => updateLink(link.studentId, { isPrimary: checked })}
                    label="Primary"
                  />

                  <button
                    type="button"
                    onClick={() => removeLink(link.studentId)}
                    aria-label={`Remove ${link.label}`}
                    title="Remove"
                    className="text-ink-muted hover:bg-error-soft hover:text-error inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors">
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-subtle text-[12.5px]">No students linked yet.</p>
          )}
        </div>
      </form>
    </Sheet>
  )
}

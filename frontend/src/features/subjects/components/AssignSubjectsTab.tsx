import { useState } from 'react'
import { Check, Layers, School } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import {
  useAssignSubjects,
  useBulkAssignSubjects,
  useClassAssignment,
  useRemoveAssignedSubject,
  useSubjects,
} from '@/features/subjects/api'
import { SubjectChip } from '@/features/subjects/components/SubjectChip'
import type { Subject } from '@/types/academic'

export function AssignSubjectsTab() {
  return (
    <div className="space-y-6">
      <SingleAssignmentPanel />
      <BulkAssignmentPanel />
    </div>
  )
}

/**
 * One class at a time. The grid offers the subjects the class does **not** yet run — an already
 * assigned one is marked and not selectable, so the button's count is what is being added; the tags
 * below are the class's current subjects, each removable on its own.
 */
function SingleAssignmentPanel() {
  const { toast } = useToast()
  const classOptions = useClassOptions()
  const catalogue = useSubjects()
  const [classId, setClassId] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const assignment = useClassAssignment(classId)
  const assignSubjects = useAssignSubjects()
  const removeSubject = useRemoveAssignedSubject()

  const assigned = assignment.data?.subjects ?? []
  const assignedIds = new Set(assigned.map((subject) => subject.id))
  const allSubjects = catalogue.data ?? []
  const classSelectOptions = [
    { value: '', label: 'Choose a class…' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  function toggle(subjectId: string) {
    setSelected((current) =>
      current.includes(subjectId) ? current.filter((id) => id !== subjectId) : [...current, subjectId],
    )
  }

  async function assign() {
    try {
      await assignSubjects.mutateAsync({ classId, subjectIds: selected })
      toast({
        tone: 'success',
        title: `${selected.length} subject${selected.length === 1 ? '' : 's'} assigned`,
        description: `Added to ${assignment.data?.className ?? 'the class'}.`,
      })
      setSelected([])
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not assign those subjects',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  async function remove(subject: Subject) {
    try {
      await removeSubject.mutateAsync({ classId, subjectId: subject.id })
      toast({ tone: 'success', title: `${subject.name} removed` })
    } catch (error) {
      toast({
        tone: 'error',
        title: `Could not remove ${subject.name}`,
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
          <School className="size-4.5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">Single Assignment</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Select one class and assign subjects to it.</p>
        </div>
      </div>

      <div className="mt-5 max-w-sm">
        <Select
          label="Select Class"
          options={classSelectOptions}
          value={classId}
          onValueChange={(value) => {
            setClassId(value)
            // The old class's pending ticks do not belong to the new one.
            setSelected([])
          }}
        />
      </div>

      {assignment.isError ? (
        <Alert tone="error" className="mt-4" title="Could not load this class's subjects">
          {assignment.error instanceof ApiError ? assignment.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="mt-6">
        <p className="text-ink text-[14px] font-medium">Select Subjects to Assign</p>

        {!classId ? (
          <p className="text-ink-subtle mt-3 text-[13px]">Choose a class to see its subjects.</p>
        ) : catalogue.isPending || assignment.isPending ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {allSubjects.map((subject) => {
              const isAssigned = assignedIds.has(subject.id)
              const isSelected = selected.includes(subject.id)

              return (
                <button
                  key={subject.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-disabled={isAssigned || undefined}
                  onClick={() => {
                    if (!isAssigned) toggle(subject.id)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    isAssigned
                      ? 'border-line bg-canvas cursor-default'
                      : isSelected
                        ? 'border-primary bg-primary-soft'
                        : 'border-line bg-surface hover:bg-primary-soft',
                  )}>
                  <span
                    className={cn(
                      'inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary bg-primary text-white' : 'border-line bg-surface',
                    )}>
                    {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="text-ink block truncate text-[14px] font-medium">{subject.name}</span>
                    <span className="text-ink-subtle block text-[12px]">{subject.code}</span>
                  </span>

                  {isAssigned ? <span className="text-ink-subtle shrink-0 text-[11px]">assigned</span> : null}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5">
        <Button onClick={assign} disabled={!classId || selected.length === 0 || assignSubjects.isPending}>
          <Check className="size-4" strokeWidth={2} />
          {selected.length === 0
            ? 'Assign Subjects'
            : `Assign ${selected.length} Subject${selected.length === 1 ? '' : 's'}`}
        </Button>
      </div>

      {classId && assigned.length > 0 ? (
        <div className="border-line mt-6 border-t pt-5">
          <p className="text-ink text-[14px] font-medium">
            Currently assigned to {assignment.data?.className ?? 'this class'}:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {assigned.map((subject) => (
              <SubjectChip
                key={subject.id}
                subject={subject}
                removing={removeSubject.isPending}
                onRemove={() => remove(subject)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}

/** Many classes at once — the same subject set added to every selected class. */
function BulkAssignmentPanel() {
  const { toast } = useToast()
  const classOptions = useClassOptions()
  const catalogue = useSubjects()
  const bulkAssign = useBulkAssignSubjects()
  const [classIds, setClassIds] = useState<string[]>([])
  const [subjectIds, setSubjectIds] = useState<string[]>([])

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  async function assign() {
    try {
      const result = await bulkAssign.mutateAsync({ classIds, subjectIds })
      toast({
        tone: 'success',
        title: `${result.added} assignment${result.added === 1 ? '' : 's'} added`,
        description: `${subjectIds.length} subject${subjectIds.length === 1 ? '' : 's'} across ${classIds.length} class${classIds.length === 1 ? '' : 'es'}.`,
      })
      setClassIds([])
      setSubjectIds([])
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not assign those subjects',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Layers className="size-4.5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.02em]">Bulk Assignment</h2>
          <p className="text-ink-muted mt-1 text-[13px]">
            Select multiple classes and subjects, then assign them all at once.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ToggleList
          title="Select Classes"
          count={classIds.length}
          options={(classOptions.data ?? []).map((option) => ({ id: option.id, name: option.label, meta: '' }))}
          selected={classIds}
          onToggle={(value) => toggle(classIds, value, setClassIds)}
          loading={classOptions.isPending}
        />

        <ToggleList
          title="Select Subjects"
          count={subjectIds.length}
          options={(catalogue.data ?? []).map((subject) => ({
            id: subject.id,
            name: subject.name,
            meta: subject.code,
          }))}
          selected={subjectIds}
          onToggle={(value) => toggle(subjectIds, value, setSubjectIds)}
          loading={catalogue.isPending}
        />
      </div>

      <div className="mt-5">
        <Button onClick={assign} disabled={classIds.length === 0 || subjectIds.length === 0 || bulkAssign.isPending}>
          <Check className="size-4" strokeWidth={2} />
          Assign subjects to selected classes
        </Button>
      </div>
    </article>
  )
}

interface ToggleListProps {
  title: string
  count: number
  options: Array<{ id: string; name: string; meta: string }>
  selected: string[]
  onToggle: (value: string) => void
  loading: boolean
}

function ToggleList({ title, count, options, selected, onToggle, loading }: ToggleListProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-ink text-[14px] font-medium">{title}</p>
        <span className="text-ink-subtle text-[12px]">{count} selected</span>
      </div>

      <div className="border-line bg-surface max-h-72 overflow-y-auto overscroll-contain rounded-xl border p-2">
        {loading ? (
          <div className="space-y-2 p-1" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.id)

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggle(option.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      isSelected ? 'bg-primary-soft' : 'hover:bg-primary-soft',
                    )}>
                    <span
                      className={cn(
                        'inline-flex size-5 shrink-0 items-center justify-center rounded-full border',
                        isSelected ? 'border-primary bg-primary text-white' : 'border-line bg-surface',
                      )}>
                      {isSelected ? <Check className="size-3" strokeWidth={3} /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="text-ink block truncate text-[14px] font-medium">{option.name}</span>
                      {option.meta ? <span className="text-ink-subtle block text-[12px]">{option.meta}</span> : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

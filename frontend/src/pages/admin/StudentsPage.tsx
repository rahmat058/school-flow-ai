import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions, useDeleteStudent, useStudents } from '@/features/students/api'
import { studentProfilePath } from '@/routes/paths'
import { StudentFormSheet } from '@/features/students/components/StudentFormSheet'
import type { FeeStanding, StudentListItem } from '@/types/people'

const PAGE_SIZE = 10

/** The school's own defaulter line: below this the bar colours as an alert, not a neutral reading. */
const ATTENDANCE_THRESHOLD = 75

export function StudentsPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [feeStanding, setFeeStanding] = useState<FeeStanding | ''>('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StudentListItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StudentListItem | null>(null)
  const navigate = useNavigate()

  // Debounced so typing does not fire a request per keystroke (setState happens in the timer cb).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const students = useStudents({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    classId: classId || undefined,
    feeStanding,
  })
  const classOptions = useClassOptions()
  const deleteStudent = useDeleteStudent()

  const total = students.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]
  const feeSelectOptions = [
    { value: '', label: 'All fee status' },
    { value: 'PAID', label: 'Paid' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ]

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(student: StudentListItem) {
    setEditing(student)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteStudent.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.firstName} ${pendingDelete.lastName} left the roster`,
        description: 'Their attendance, fee and exam history is kept.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove the student',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const columns: Array<DataTableColumn<StudentListItem>> = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName} ${row.lastName}`} size="sm" />
          <div className="min-w-0">
            <p className="text-ink truncate text-[14px] font-medium">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-ink-subtle font-mono text-[12px]">{row.admissionNo}</p>
          </div>
        </div>
      ),
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'roll',
      header: 'Roll no.',
      sortValue: (row) => row.rollNo,
      cell: (row) => <span className="text-ink-muted tabular-nums">{row.rollNo}</span>,
    },
    {
      id: 'attendance',
      header: 'Attendance',
      sortValue: (row) => row.attendancePercentage,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Progress
            value={row.attendancePercentage}
            tone={row.attendancePercentage < ATTENDANCE_THRESHOLD ? 'error' : 'primary'}
            className="w-16"
          />
          <span className="text-ink-muted text-[12px] tabular-nums">{row.attendancePercentage}%</span>
        </div>
      ),
    },
    {
      id: 'fees',
      header: 'Fee status',
      sortValue: (row) => row.feeStanding,
      cell: (row) => <StatusBadge status={row.feeStanding} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <Dropdown
            triggerLabel={`Actions for ${row.firstName} ${row.lastName}`}
            trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
            items={[
              { id: 'view', label: 'View', icon: Eye, onSelect: () => navigate(studentProfilePath(row.id)) },
              { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => openEdit(row) },
              {
                id: 'delete',
                label: 'Delete',
                icon: Trash2,
                danger: true,
                separatorBefore: true,
                onSelect: () => setPendingDelete(row),
              },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Students</h1>
          <p className="text-ink-muted text-[14px]">
            {students.isPending ? 'Loading the roster…' : `${total} students enrolled across all classes.`}
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add student
        </Button>
      </header>

      {students.isError ? (
        <Alert tone="error" title="Could not load students">
          {students.error instanceof ApiError ? students.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Input
            icon={Search}
            type="search"
            placeholder="Search by name, roll no. or admission no."
            aria-label="Search students"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          className="max-w-[200px]"
          options={classSelectOptions}
          value={classId}
          onValueChange={setClassId}
          aria-label="Filter by class"
        />

        <Select
          className="max-w-[200px]"
          options={feeSelectOptions}
          value={feeStanding}
          onValueChange={(value) =>
            setFeeStanding(value === 'PAID' || value === 'UNPAID' || value === 'OVERDUE' ? value : '')
          }
          aria-label="Filter by fee status"
        />
      </div>

      <DataTable
        data={students.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={students.isPending}
        pageSize={PAGE_SIZE}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
        emptyIcon={Users}
        emptyTitle="No students found"
        emptyDescription="Try a different name or clear the filters."
      />

      {/* Keyed on the target so the form remounts with that student's values, never the last edit. */}
      <StudentFormSheet
        key={editing?.id ?? 'new'}
        open={formOpen}
        student={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove this student?"
        description={
          pendingDelete
            ? `${pendingDelete.firstName} ${pendingDelete.lastName} leaves the roster. Their attendance, fee and exam history stays on record.`
            : undefined
        }
        confirmLabel="Remove student"
        tone="danger"
        loading={deleteStudent.isPending}
      />
    </div>
  )
}

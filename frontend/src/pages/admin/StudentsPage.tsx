import { useEffect, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { useClassOptions, useStudents } from '@/features/students/api'
import { ApiError } from '@/services/apiClient'
import type { StudentListItem } from '@/types/people'

const PAGE_SIZE = 10

const columns: Array<DataTableColumn<StudentListItem>> = [
  {
    id: 'student',
    header: 'Student',
    sortValue: (row) => row.admissionNo,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-ink text-[14px] font-medium">
          {row.firstName} {row.lastName}
        </p>
        <p className="text-ink-subtle font-mono text-[12px]">{row.admissionNo}</p>
      </div>
    ),
  },
  { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
  {
    id: 'guardian',
    header: 'Primary guardian',
    cell: (row) => <span className="text-ink-muted">{row.guardianName ?? '—'}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (row) => row.status,
    cell: (row) => <StatusBadge status={row.status} />,
  },
]

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [page, setPage] = useState(1)

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
  })
  const classOptions = useClassOptions()

  const total = students.data?.meta.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const selectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Students</h1>
        <p className="text-ink-muted text-[14px]">
          {students.isPending ? 'Loading the roster…' : `${total} students enrolled across all classes.`}
        </p>
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
            placeholder="Search name or admission no."
            aria-label="Search students"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          className="max-w-[200px]"
          options={selectOptions}
          value={classId}
          onValueChange={setClassId}
          aria-label="Filter by class"
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
        emptyDescription="Try a different name or clear the class filter."
      />
    </div>
  )
}

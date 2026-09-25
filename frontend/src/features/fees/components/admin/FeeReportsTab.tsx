import { useState } from 'react'
import { Download } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/Badge'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useClassReport, useDayBook, useDefaulters, useStudentLedger, useStudentOptions } from '@/features/fees/api'
import { downloadCsv } from '@/lib/csv'
import type { ClassReportRow, DayBookRow, DefaulterRow, StudentLedgerRow } from '@/types/fees'

export function FeeReportsTab() {
  return (
    <Tabs defaultValue="day-book">
      <TabList>
        <Tab value="day-book">Day book</Tab>
        <Tab value="class">Class report</Tab>
        <Tab value="defaulters">Defaulters</Tab>
        <Tab value="ledger">Student ledger</Tab>
      </TabList>

      <TabPanel value="day-book">
        <DayBookPanel />
      </TabPanel>
      <TabPanel value="class">
        <ClassReportPanel />
      </TabPanel>
      <TabPanel value="defaulters">
        <DefaultersPanel />
      </TabPanel>
      <TabPanel value="ledger">
        <StudentLedgerPanel />
      </TabPanel>
    </Tabs>
  )
}

function DayBookPanel() {
  const [date, setDate] = useState('')
  const dayBook = useDayBook(date)
  const rows = dayBook.data?.rows ?? []

  const columns: Array<DataTableColumn<DayBookRow>> = [
    {
      id: 'receipt',
      header: 'Receipt no',
      cell: (row) => <span className="text-ink-subtle font-mono text-[12px]">{row.receiptNo}</span>,
    },
    {
      id: 'student',
      header: 'Student',
      cell: (row) => <span className="text-ink font-medium">{row.studentName}</span>,
    },
    { id: 'class', header: 'Class', cell: (row) => row.className },
    { id: 'title', header: 'Title', cell: (row) => <span className="text-ink-muted text-[13px]">{row.title}</span> },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="text-success font-medium tabular-nums">{formatPaise(row.amountPaise)}</span>,
    },
    {
      id: 'mode',
      header: 'Mode',
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {humanizeEnum(row.method)}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-[220px]">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            hint="Blank shows the latest collection day."
          />
        </div>

        <Button
          variant="secondary"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              'fee-day-book.csv',
              [
                { header: 'Receipt No', value: (row: DayBookRow) => row.receiptNo },
                { header: 'Student', value: (row: DayBookRow) => row.studentName },
                { header: 'Class', value: (row: DayBookRow) => row.className },
                { header: 'Title', value: (row: DayBookRow) => row.title },
                { header: 'Amount', value: (row: DayBookRow) => (row.amountPaise / 100).toFixed(2) },
                { header: 'Mode', value: (row: DayBookRow) => humanizeEnum(row.method) },
                { header: 'Status', value: (row: DayBookRow) => humanizeEnum(row.status) },
              ],
              rows,
            )
          }>
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>

      {dayBook.isError ? (
        <Alert tone="error" title="Could not load the day book">
          {dayBook.error instanceof ApiError ? dayBook.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        loading={dayBook.isPending}
        pageSize={10}
        emptyTitle="No collections on this day"
        emptyDescription="Pick another date, or clear the filter for the latest collection day."
      />

      <div className="text-ink-muted flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-[13px]">
        <span>
          Transactions: <span className="text-ink font-medium">{dayBook.data?.count ?? 0}</span>
        </span>
        <span>
          Total collected:{' '}
          <span className="text-success font-medium tabular-nums">{formatPaise(dayBook.data?.totalPaise ?? 0)}</span>
        </span>
      </div>
    </div>
  )
}

function ClassReportPanel() {
  const classOptions = useClassOptions()
  const [selectedClassId, setSelectedClassId] = useState('')
  const classId = selectedClassId || classOptions.data?.[0]?.id || ''
  const report = useClassReport(classId)

  const columns: Array<DataTableColumn<ClassReportRow>> = [
    {
      id: 'student',
      header: 'Student',
      cell: (row) => <span className="text-ink font-medium">{row.studentName}</span>,
    },
    { id: 'roll', header: 'Roll no', cell: (row) => <span className="text-ink-muted tabular-nums">{row.rollNo}</span> },
    {
      id: 'invoiced',
      header: 'Total invoiced',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatPaise(row.totalInvoicedPaise)}</span>,
    },
    {
      id: 'paid',
      header: 'Total paid',
      align: 'right',
      cell: (row) => <span className="text-success tabular-nums">{formatPaise(row.totalPaidPaise)}</span>,
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (row) => (
        <span className={row.balancePaise > 0 ? 'text-error font-medium tabular-nums' : 'text-success tabular-nums'}>
          {row.balancePaise > 0 ? formatPaise(row.balancePaise) : '✓ Clear'}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <Select
        className="max-w-[220px]"
        label="Class"
        options={(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label }))}
        value={classId}
        onValueChange={setSelectedClassId}
      />

      {report.isError ? (
        <Alert tone="error" title="Could not load the class report">
          {report.error instanceof ApiError ? report.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={report.data ?? []}
        columns={columns}
        getRowId={(row) => row.studentId}
        loading={report.isPending}
        pageSize={10}
        emptyTitle="No students in this class"
        emptyDescription="Pick another class."
      />
    </div>
  )
}

function DefaultersPanel() {
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const defaulters = useDefaulters(classId)
  const rows = defaulters.data ?? []

  const columns: Array<DataTableColumn<DefaulterRow>> = [
    {
      id: 'student',
      header: 'Student',
      cell: (row) => <span className="text-ink font-medium">{row.studentName}</span>,
    },
    { id: 'class', header: 'Class', cell: (row) => row.className },
    { id: 'roll', header: 'Roll no', cell: (row) => <span className="text-ink-muted tabular-nums">{row.rollNo}</span> },
    { id: 'title', header: 'Title', cell: (row) => <span className="text-ink-muted text-[13px]">{row.title}</span> },
    {
      id: 'due',
      header: 'Due amount',
      align: 'right',
      cell: (row) => <span className="text-error font-medium tabular-nums">{formatPaise(row.duePaise)}</span>,
    },
    {
      id: 'date',
      header: 'Due date',
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select
          className="max-w-[220px]"
          label="Class"
          options={[
            { value: '', label: 'All classes' },
            ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
          ]}
          value={classId}
          onValueChange={setClassId}
        />

        <Button
          variant="secondary"
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              'fee-defaulters.csv',
              [
                { header: 'Student', value: (row: DefaulterRow) => row.studentName },
                { header: 'Class', value: (row: DefaulterRow) => row.className },
                { header: 'Roll No', value: (row: DefaulterRow) => row.rollNo },
                { header: 'Title', value: (row: DefaulterRow) => row.title },
                { header: 'Due Amount', value: (row: DefaulterRow) => (row.duePaise / 100).toFixed(2) },
                { header: 'Due Date', value: (row: DefaulterRow) => row.dueDate },
                { header: 'Status', value: (row: DefaulterRow) => humanizeEnum(row.status) },
              ],
              rows,
            )
          }>
          <Download className="size-4" strokeWidth={1.75} />
          Export
        </Button>
      </div>

      {defaulters.isError ? (
        <Alert tone="error" title="Could not load the defaulter report">
          {defaulters.error instanceof ApiError ? defaulters.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={rows}
        columns={columns}
        getRowId={(row) => `${row.studentId}-${row.title}`}
        loading={defaulters.isPending}
        pageSize={10}
        emptyTitle="No defaulters"
        emptyDescription="Nothing is outstanding for this filter."
      />
    </div>
  )
}

function StudentLedgerPanel() {
  const students = useStudentOptions()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const studentId = selectedStudentId || students.data?.[0]?.value || ''
  const ledger = useStudentLedger(studentId)

  const columns: Array<DataTableColumn<StudentLedgerRow>> = [
    {
      id: 'receipt',
      header: 'Receipt no',
      cell: (row) => <span className="text-ink-subtle font-mono text-[12px]">{row.receiptNo ?? '—'}</span>,
    },
    {
      id: 'title',
      header: 'Title',
      cell: (row) => <span className="text-ink text-[13px] font-medium">{row.title}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (row) => <span className="tabular-nums">{formatPaise(row.amountPaise)}</span>,
    },
    {
      id: 'paid',
      header: 'Paid',
      align: 'right',
      cell: (row) => (
        <span className={row.paidPaise > 0 ? 'text-success font-medium tabular-nums' : 'text-ink-muted tabular-nums'}>
          {row.paidPaise > 0 ? formatPaise(row.paidPaise) : '—'}
        </span>
      ),
    },
    {
      id: 'mode',
      header: 'Mode',
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {row.method ? humanizeEnum(row.method) : '—'}
        </span>
      ),
    },
    {
      id: 'due',
      header: 'Due date',
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    {
      id: 'paidAt',
      header: 'Paid date',
      cell: (row) => (
        <span className="text-ink-muted whitespace-nowrap">{row.paidAt ? formatDate(row.paidAt) : '—'}</span>
      ),
    },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="space-y-4">
      <Select
        className="max-w-[320px]"
        label="Student"
        options={students.data ?? []}
        value={studentId}
        onValueChange={setSelectedStudentId}
      />

      {ledger.isError ? (
        <Alert tone="error" title="Could not load the student ledger">
          {ledger.error instanceof ApiError ? ledger.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={ledger.data?.rows ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={ledger.isPending}
        pageSize={10}
        emptyTitle="No ledger entries"
        emptyDescription="Nothing has been billed to this student yet."
      />

      <div className="text-ink-muted flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-[13px]">
        <span>
          Total invoiced:{' '}
          <span className="text-ink font-medium tabular-nums">{formatPaise(ledger.data?.totalInvoicedPaise ?? 0)}</span>
        </span>
        <span>
          Total paid:{' '}
          <span className="text-success font-medium tabular-nums">{formatPaise(ledger.data?.totalPaidPaise ?? 0)}</span>
        </span>
        <span>
          Balance:{' '}
          <span className="text-error font-medium tabular-nums">{formatPaise(ledger.data?.balancePaise ?? 0)}</span>
        </span>
      </div>
    </div>
  )
}

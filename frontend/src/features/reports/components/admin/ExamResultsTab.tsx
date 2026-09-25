import { useState } from 'react'
import { CheckCircle2, Download, TrendingUp, Users, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { downloadCsv } from '@/lib/csv'
import { ApiError } from '@/services/apiClient'
import { useExamPaperOptions, useExamResultsReport } from '@/features/reports/api'
import { GradeDistributionChart } from '@/features/reports/components/admin/GradeDistributionChart'
import { ReportStat } from '@/features/reports/components/admin/ReportStat'
import type { ExamResultRow } from '@/types/reports'

export function ExamResultsTab() {
  const papers = useExamPaperOptions()
  const options = papers.data ?? []
  const [chosenPaperId, setChosenPaperId] = useState('')

  // Derived, so the tab opens on the first paper without an effect writing state after a fetch.
  const paperId = chosenPaperId || options[0]?.id || ''
  const report = useExamResultsReport(paperId)
  const data = report.data

  const columns: Array<DataTableColumn<ExamResultRow>> = [
    {
      id: 'index',
      header: '#',
      className: 'w-12',
      cell: (row) => <span className="text-ink-subtle tabular-nums">{(data?.rows.indexOf(row) ?? 0) + 1}</span>,
    },
    {
      id: 'student',
      header: 'Student',
      cell: (row) => (
        <div>
          <p className="text-ink text-[14px] font-medium">{row.studentName}</p>
          <p className="text-ink-subtle text-[12px]">{row.admissionNo}</p>
        </div>
      ),
    },
    {
      id: 'roll',
      header: 'Roll No',
      align: 'center',
      cell: (row) => <span className="tabular-nums">{row.rollNo}</span>,
    },
    {
      id: 'marks',
      header: 'Marks',
      align: 'center',
      cell: (row) => (
        <span className="text-ink tabular-nums">{row.marks === null ? '—' : `${row.marks} / ${row.maxMarks}`}</span>
      ),
    },
    {
      id: 'percentage',
      header: 'Percentage',
      align: 'center',
      cell: (row) => <span className="tabular-nums">{row.percentage === null ? '—' : `${row.percentage}%`}</span>,
    },
    {
      id: 'grade',
      header: 'Grade',
      align: 'center',
      cell: (row) =>
        row.grade ? (
          <span className="bg-primary-soft text-primary inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.04em] uppercase">
            {row.grade}
          </span>
        ) : (
          <span className="text-ink-subtle">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      cell: (row) =>
        row.passed === null ? <StatusBadge status="ABSENT" /> : <StatusBadge status={row.passed ? 'PASS' : 'FAIL'} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xl">
          <Select
            label="Select Exam"
            options={options.map((option) => ({ value: option.id, label: option.label }))}
            placeholder={papers.isPending ? 'Loading papers…' : 'Choose an exam to view results'}
            value={paperId}
            onValueChange={setChosenPaperId}
          />
        </div>

        <Button
          variant="secondary"
          disabled={!data || data.rows.length === 0}
          onClick={() => {
            if (!data) return

            downloadCsv(
              `exam-results-${data.paperId}.csv`,
              [
                { header: 'Student', value: (row: ExamResultRow) => row.studentName },
                { header: 'Roll No', value: (row) => row.rollNo },
                { header: 'Marks', value: (row) => row.marks ?? '' },
                { header: 'Max Marks', value: (row) => row.maxMarks },
                { header: 'Percentage', value: (row) => row.percentage ?? '' },
                { header: 'Grade', value: (row) => row.grade ?? '' },
                {
                  header: 'Status',
                  value: (row) => (row.passed === null ? 'Absent' : row.passed ? 'Pass' : 'Fail'),
                },
              ],
              data.rows,
            )
          }}>
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>

      {papers.isError || report.isError ? (
        <Alert tone="error" title="Could not load the exam results">
          {report.error instanceof ApiError ? report.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      {report.isPending || !data ? (
        <div className="space-y-6" aria-busy="true">
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-36 rounded-xl" />
            ))}
          </section>
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <ReportStat
              icon={Users}
              tone="primary"
              label="Total Students"
              value={data.totalStudents.toLocaleString('en-US')}
            />
            <ReportStat icon={CheckCircle2} tone="success" label="Passed" value={String(data.passed)} />
            <ReportStat icon={XCircle} tone="error" label="Failed" value={String(data.failed)} />
            <ReportStat icon={TrendingUp} tone="warning" label="Average Score" value={`${data.averagePercentage}%`} />
          </section>

          <GradeDistributionChart distribution={data.gradeDistribution} />

          <section className="space-y-3">
            <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
              Student Results ({data.rows.length})
            </h2>

            <DataTable
              data={data.rows}
              columns={columns}
              getRowId={(row) => row.studentId}
              emptyTitle="No students on this paper"
              emptyDescription="The class roster for this paper is empty."
            />
          </section>
        </>
      )}
    </div>
  )
}

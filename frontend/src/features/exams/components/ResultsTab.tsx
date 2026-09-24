import { useState } from 'react'
import { Save, SendHorizontal } from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { Tab, TabList, TabPanel, Tabs } from '@/components/ui/Tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { formatDate } from '@/lib/format'
import { gradeForPercentage, isPass, percentageOf } from '@/lib/grades'
import { EXAM_TYPE_LABELS, examKindOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useExams, usePublishExam, useResultSheet, useSaveMarks, useTests } from '@/features/exams/api'
import type { ExamKind, ResultEntryInput } from '@/types/exams'

/** A touched cell: the text as typed, so an empty field stays empty rather than becoming a zero. */
type Draft = Record<string, { marks: string; remarks: string }>

const cellKey = (studentId: string, subjectId: string) => `${studentId}:${subjectId}`

export function ResultsTab() {
  const classOptions = useClassOptions()
  const [classId, setClassId] = useState('')
  const [kind, setKind] = useState<ExamKind>('EXAM')
  const [examId, setExamId] = useState('')

  const exams = useExams(classId ? { classId } : {})
  const tests = useTests(classId ? { classId } : {})

  const examSelectOptions = [
    { value: '', label: 'Select exam…' },
    ...(kind === 'EXAM'
      ? (exams.data ?? []).map((exam) => ({
          value: exam.id,
          label: `${exam.name} — ${exam.className} (${EXAM_TYPE_LABELS[exam.type]})`,
        }))
      : (tests.data ?? []).map((test) => ({ value: test.id, label: `${test.name} — ${test.className}` }))),
  ]

  const classSelectOptions = [
    { value: '', label: 'Select class…' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  return (
    <div className="space-y-4">
      <section className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card)">
        <h2 className="font-display text-ink text-[17px] font-semibold tracking-[-0.02em]">Result entry</h2>
        <p className="text-ink-muted mt-1 text-[13px]">
          Select a class and exam — all subjects load together for bulk mark entry.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select
            label="Class"
            options={classSelectOptions}
            value={classId}
            onValueChange={(value) => {
              setClassId(value)
              setExamId('')
            }}
          />
          <Select
            label="Source type"
            options={examKindOptions}
            value={kind}
            onValueChange={(value) => {
              setKind(value as ExamKind)
              setExamId('')
            }}
          />
          <Select
            label="Select exam"
            options={examSelectOptions}
            value={examId}
            onValueChange={setExamId}
            disabled={!classId}
          />
        </div>
      </section>

      {/* Keyed on the exam so an unsaved grid never carries across to the next one. */}
      <MarksGrid key={examId || 'none'} examId={examId || null} />
    </div>
  )
}

function MarksGrid({ examId }: { examId: string | null }) {
  const { toast } = useToast()
  const sheet = useResultSheet(examId)
  const saveMarks = useSaveMarks()
  const publish = usePublishExam()
  const [draft, setDraft] = useState<Draft>({})
  const [pickedSubjectId, setPickedSubjectId] = useState('')

  if (!examId) return null

  if (sheet.isPending) {
    return <Skeleton className="h-72 rounded-xl" />
  }

  const data = sheet.data
  if (!data) return null

  const activeSubjectId = data.subjects.some((subject) => subject.subjectId === pickedSubjectId)
    ? pickedSubjectId
    : (data.subjects[0]?.subjectId ?? '')
  const activeSubject = data.subjects.find((subject) => subject.subjectId === activeSubjectId)
  if (!activeSubject) return null

  function serverEntry(studentId: string, subjectId: string) {
    return data?.entries.find((entry) => entry.studentId === studentId && entry.subjectId === subjectId)
  }

  function setCell(studentId: string, subjectId: string, patch: Partial<{ marks: string; remarks: string }>) {
    const key = cellKey(studentId, subjectId)
    const stored = serverEntry(studentId, subjectId)

    setDraft((current) => {
      const base = current[key] ?? {
        marks: stored?.marks != null ? String(stored.marks) : '',
        remarks: stored?.remarks ?? '',
      }

      return { ...current, [key]: { ...base, ...patch } }
    })
  }

  async function handleSave() {
    if (!examId) return

    const entries: ResultEntryInput[] = Object.entries(draft).map(([key, value]) => {
      const [studentId, subjectId] = key.split(':')
      const parsed = value.marks.trim() === '' ? null : Number(value.marks)

      return {
        studentId,
        subjectId,
        marks: parsed === null || Number.isNaN(parsed) ? null : parsed,
        remarks: value.remarks.trim() || null,
      }
    })

    if (entries.length === 0) {
      toast({ tone: 'info', title: 'Nothing to save', description: 'Enter a mark or a remark first.' })
      return
    }

    try {
      await saveMarks.mutateAsync({ examId, entries })
      setDraft({})
      toast({ tone: 'success', title: 'Marks saved', description: 'They stay a draft until you publish.' })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not save marks',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  async function handlePublish() {
    if (!examId) return

    try {
      await publish.mutateAsync({ examId, publish: !data?.isPublished })
      toast({
        tone: 'success',
        title: data?.isPublished ? 'Results unpublished' : 'Results published',
        description: data?.isPublished
          ? 'They are editable again, and the report cards are withdrawn.'
          : 'Report cards are written and the marks are locked.',
      })
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not change the publish state',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <section className="border-line bg-surface rounded-xl border shadow-(--shadow-card)">
      <header className="border-line flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div className="min-w-0">
          <h2 className="font-display text-ink text-[17px] font-semibold tracking-[-0.02em]">{data.examName}</h2>
          <p className="text-ink-muted mt-1 text-[13px]">
            {data.subjects.length} subjects · {data.students.length} students
            {data.isPublished ? ' · published' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={handleSave} disabled={saveMarks.isPending}>
            {saveMarks.isPending ? (
              <Spinner size="sm" label="Saving" />
            ) : (
              <Save className="size-4" strokeWidth={1.75} />
            )}
            Save all
          </Button>

          {data.isPublished ? (
            <Button variant="secondary" onClick={handlePublish} disabled={publish.isPending}>
              Unpublish all
            </Button>
          ) : (
            <Button onClick={handlePublish} disabled={publish.isPending}>
              <SendHorizontal className="size-4" strokeWidth={1.75} />
              Publish all
            </Button>
          )}
        </div>
      </header>

      <Tabs value={activeSubjectId} onValueChange={setPickedSubjectId} className="px-5 pt-4">
        <TabList>
          {data.subjects.map((subject) => (
            <Tab key={subject.subjectId} value={subject.subjectId}>
              <span className="flex items-center gap-2">
                <span>{subject.subjectName}</span>
                <span className="text-ink-subtle text-[11.5px] font-normal">
                  ({formatDate(subject.examDate, 'd MMM yyyy')} · {subject.maxMarks}M)
                </span>
                <span className="bg-canvas text-ink-muted rounded-full px-1.5 py-0.5 text-[10.5px] tabular-nums">
                  {subject.enteredCount}/{data.students.length}
                </span>
              </span>
            </Tab>
          ))}
        </TabList>

        <TabPanel value={activeSubjectId}>
          <div className="pb-5">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll no.</TableHead>
                  <TableHead>Marks / {activeSubject.maxMarks}</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.students.map((student, index) => {
                  const key = cellKey(student.studentId, activeSubject.subjectId)
                  const stored = serverEntry(student.studentId, activeSubject.subjectId)
                  const marksText = draft[key]?.marks ?? (stored?.marks != null ? String(stored.marks) : '')
                  const remarksText = draft[key]?.remarks ?? stored?.remarks ?? ''
                  const parsed = marksText.trim() === '' ? null : Number(marksText)
                  const percentage =
                    parsed === null || Number.isNaN(parsed) ? null : percentageOf(parsed, activeSubject.maxMarks)
                  const dirty = draft[key] !== undefined

                  return (
                    <TableRow key={student.studentId}>
                      <TableCell className="text-ink-muted tabular-nums">{index + 1}</TableCell>
                      <TableCell>
                        <span className="flex flex-col">
                          <span className="text-ink font-medium">{student.studentName}</span>
                          <span className="text-ink-subtle font-mono text-[11.5px]">{student.admissionNo}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-ink-muted tabular-nums">{student.rollNo}</TableCell>

                      <TableCell className="w-32">
                        {stored?.isAbsent && !dirty ? (
                          <span className="text-ink-subtle text-[13px]">Absent</span>
                        ) : (
                          <Input
                            type="number"
                            min={0}
                            className="h-9 rounded-md"
                            placeholder={`0–${activeSubject.maxMarks}`}
                            aria-label={`${student.studentName} marks`}
                            value={marksText}
                            onChange={(event) =>
                              setCell(student.studentId, activeSubject.subjectId, { marks: event.target.value })
                            }
                          />
                        )}
                      </TableCell>

                      <TableCell className="w-48">
                        <Input
                          className="h-9 rounded-md"
                          placeholder="Optional"
                          aria-label={`${student.studentName} remarks`}
                          value={remarksText}
                          onChange={(event) =>
                            setCell(student.studentId, activeSubject.subjectId, { remarks: event.target.value })
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {percentage === null ? (
                          <span className="text-ink-subtle">—</span>
                        ) : (
                          <span className="bg-primary-soft text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium tabular-nums">
                            {gradeForPercentage(percentage)} ({percentage}%)
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {percentage === null ? (
                          <span className="text-ink-subtle">—</span>
                        ) : (
                          <StatusBadge status={isPass(percentage) ? 'PASS' : 'FAIL'} />
                        )}
                      </TableCell>

                      <TableCell>
                        {dirty ? (
                          <span className="text-warning text-[12px] font-medium">Unsaved</span>
                        ) : stored?.marks == null ? (
                          <span className="text-ink-subtle">—</span>
                        ) : (
                          <StatusBadge status={data.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabPanel>
      </Tabs>
    </section>
  )
}

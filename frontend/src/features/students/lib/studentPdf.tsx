import { Document, pdf } from '@react-pdf/renderer'
import { formatDate, formatPaise } from '@/lib/format'
import {
  Row,
  SheetEmpty,
  SheetHeading,
  SheetNote,
  SheetPage,
  SheetTable,
  Summary,
  Tile,
} from '@/features/students/lib/pdfParts'
import type {
  StudentAttendance,
  StudentDocument,
  StudentFees,
  StudentMarkRow,
  StudentProfile,
  StudentResults,
} from '@/types/people'

/**
 * Builders for the student sheets, imported on demand by `DownloadSheetButton` so the renderer
 * ships as its own chunk. Plain functions only — the presentational pieces live in `pdfParts.tsx`.
 */

interface SheetContext {
  schoolName: string
  profile: StudentProfile
}

function generated(): string {
  return new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function save(sheet: Parameters<typeof pdf>[0], fileName: string): Promise<void> {
  const blob = await pdf(sheet).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export async function downloadResultPdf({
  schoolName,
  profile,
  results,
  rows,
}: SheetContext & { results: StudentResults; rows: StudentMarkRow[] }): Promise<void> {
  const sheet = (
    <Document title={`Result sheet — ${profile.firstName} ${profile.lastName}`} author={schoolName}>
      <SheetPage>
        <SheetHeading schoolName={schoolName} title="Result sheet" profile={profile} />

        <Summary>
          <Tile label="Papers passed" value={String(results.summary.passed)} />
          <Tile label="Papers failed" value={String(results.summary.failed)} />
          <Tile label="Average" value={`${results.summary.average}%`} />
        </Summary>

        <SheetTable
          head={[
            { text: 'Exam / test', width: 150 },
            { text: 'Subject', width: 90 },
            { text: 'Type', width: 50 },
            { text: 'Date', width: 70 },
            { text: 'Marks', width: 55, align: 'right' },
            { text: '%', width: 45, align: 'right' },
            { text: 'Grade', width: 40, align: 'right' },
            { text: 'Result', width: 40, align: 'right' },
          ]}>
          {rows.map((row) => (
            <Row
              key={row.id}
              cells={[
                { text: row.examName, width: 150 },
                { text: row.subjectName, width: 90 },
                { text: row.examType, width: 50 },
                { text: formatDate(row.date, 'dd MMM yyyy'), width: 70 },
                { text: `${row.marks} / ${row.total}`, width: 55, align: 'right' },
                { text: `${row.percentage}%`, width: 45, align: 'right' },
                { text: row.grade, width: 40, align: 'right' },
                { text: row.result === 'PASS' ? 'Pass' : 'Fail', width: 40, align: 'right' },
              ]}
            />
          ))}
        </SheetTable>

        <SheetNote text={`${rows.length} papers · generated ${generated()}`} />
      </SheetPage>
    </Document>
  )

  await save(sheet, `result-sheet-${profile.admissionNo}.pdf`)
}

export async function downloadMarksPdf({
  schoolName,
  profile,
  rows,
}: SheetContext & { rows: StudentMarkRow[] }): Promise<void> {
  const sheet = (
    <Document title={`Marks sheet — ${profile.firstName} ${profile.lastName}`} author={schoolName}>
      <SheetPage>
        <SheetHeading schoolName={schoolName} title="Marks sheet" profile={profile} />

        {rows.length === 0 ? (
          <SheetEmpty text="No marks recorded yet." />
        ) : (
          <SheetTable
            head={[
              { text: 'Subject', width: 150 },
              { text: 'Exam', width: 150 },
              { text: 'Type', width: 60 },
              { text: 'Marks', width: 60, align: 'right' },
              { text: 'Total', width: 50, align: 'right' },
              { text: '%', width: 45, align: 'right' },
              { text: 'Grade', width: 45, align: 'right' },
            ]}>
            {rows.map((row) => (
              <Row
                key={row.id}
                cells={[
                  { text: row.subjectName, width: 150 },
                  { text: row.examName, width: 150 },
                  { text: row.examType, width: 60 },
                  { text: String(row.marks), width: 60, align: 'right' },
                  { text: String(row.total), width: 50, align: 'right' },
                  { text: `${row.percentage}%`, width: 45, align: 'right' },
                  { text: row.grade, width: 45, align: 'right' },
                ]}
              />
            ))}
          </SheetTable>
        )}

        <SheetNote text={`${rows.length} papers · generated ${generated()}`} />
      </SheetPage>
    </Document>
  )

  await save(sheet, `marks-${profile.admissionNo}.pdf`)
}

export async function downloadAttendancePdf({
  schoolName,
  profile,
  attendance,
}: SheetContext & { attendance: StudentAttendance }): Promise<void> {
  const { totals, months } = attendance

  const sheet = (
    <Document title={`Attendance sheet — ${profile.firstName} ${profile.lastName}`} author={schoolName}>
      <SheetPage>
        <SheetHeading schoolName={schoolName} title="Attendance sheet" profile={profile} />

        <Summary>
          <Tile label="Total days" value={String(totals.total)} />
          <Tile label="Present" value={String(totals.present)} />
          <Tile label="Absent" value={String(totals.absent)} />
          <Tile label="Late" value={String(totals.late)} />
          <Tile label="Rate" value={`${totals.rate}%`} />
        </Summary>

        <SheetTable
          head={[
            { text: 'Month', width: 170 },
            { text: 'Present', width: 70, align: 'right' },
            { text: 'Absent', width: 70, align: 'right' },
            { text: 'Late', width: 70, align: 'right' },
            { text: 'Total', width: 70, align: 'right' },
            { text: 'Rate', width: 70, align: 'right' },
          ]}>
          {months.map((month) => (
            <Row
              key={month.month}
              cells={[
                { text: month.month, width: 170 },
                { text: String(month.present), width: 70, align: 'right' },
                { text: String(month.absent), width: 70, align: 'right' },
                { text: String(month.late), width: 70, align: 'right' },
                { text: String(month.total), width: 70, align: 'right' },
                { text: `${month.rate}%`, width: 70, align: 'right' },
              ]}
            />
          ))}
        </SheetTable>

        <SheetNote text={`Rate counts present and late together · generated ${generated()}`} />
      </SheetPage>
    </Document>
  )

  await save(sheet, `attendance-${profile.admissionNo}.pdf`)
}

export async function downloadFeesPdf({
  schoolName,
  profile,
  fees,
}: SheetContext & { fees: StudentFees }): Promise<void> {
  const { summary, rows } = fees

  const sheet = (
    <Document title={`Fee statement — ${profile.firstName} ${profile.lastName}`} author={schoolName}>
      <SheetPage>
        <SheetHeading schoolName={schoolName} title="Fee statement" profile={profile} />

        <Summary>
          <Tile label="Total paid" value={formatPaise(summary.paidPaise)} />
          <Tile label="Outstanding" value={formatPaise(summary.duePaise)} />
          <Tile label="Total billed" value={formatPaise(summary.totalPaise)} />
        </Summary>

        <SheetTable
          head={[
            { text: 'Title', width: 190 },
            { text: 'Amount', width: 70, align: 'right' },
            { text: 'Paid', width: 70, align: 'right' },
            { text: 'Date paid', width: 80, align: 'right' },
            { text: 'Mode', width: 60, align: 'right' },
            { text: 'Status', width: 60, align: 'right' },
          ]}>
          {rows.map((row) => (
            <Row
              key={row.id}
              cells={[
                { text: row.title, width: 190 },
                { text: formatPaise(row.amountPaise), width: 70, align: 'right' },
                { text: formatPaise(row.paidPaise), width: 70, align: 'right' },
                { text: row.paidAt ? formatDate(row.paidAt, 'dd MMM yyyy') : '—', width: 80, align: 'right' },
                { text: row.method ?? '—', width: 60, align: 'right' },
                { text: row.status, width: 60, align: 'right' },
              ]}
            />
          ))}
        </SheetTable>

        <SheetNote text={`${rows.length} invoices · generated ${generated()}`} />
      </SheetPage>
    </Document>
  )

  await save(sheet, `fees-${profile.admissionNo}.pdf`)
}

export async function downloadDocumentsPdf({
  schoolName,
  profile,
  documents,
}: SheetContext & { documents: StudentDocument[] }): Promise<void> {
  const sheet = (
    <Document title={`Document index — ${profile.firstName} ${profile.lastName}`} author={schoolName}>
      <SheetPage>
        <SheetHeading schoolName={schoolName} title="Document index" profile={profile} />

        {documents.length === 0 ? (
          <SheetEmpty text="No documents held for this student yet." />
        ) : (
          <SheetTable
            head={[
              { text: 'Title', width: 230 },
              { text: 'Kind', width: 100 },
              { text: 'Size', width: 70, align: 'right' },
              { text: 'Uploaded', width: 100, align: 'right' },
            ]}>
            {documents.map((document) => (
              <Row
                key={document.id}
                cells={[
                  { text: document.title, width: 230 },
                  { text: document.kind, width: 100 },
                  { text: `${document.sizeKb} KB`, width: 70, align: 'right' },
                  { text: formatDate(document.uploadedAt, 'dd MMM yyyy'), width: 100, align: 'right' },
                ]}
              />
            ))}
          </SheetTable>
        )}

        <SheetNote text={`${documents.length} documents · generated ${generated()}`} />
      </SheetPage>
    </Document>
  )

  await save(sheet, `documents-${profile.admissionNo}.pdf`)
}

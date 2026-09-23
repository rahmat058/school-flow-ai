import { FileText } from 'lucide-react'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/DownloadSheetButton'
import type { StudentDocument, StudentProfile } from '@/types/people'

interface StudentDocumentsTabProps {
  profile: StudentProfile
  documents: StudentDocument[]
}

/**
 * Documents. Nothing is stored against a student yet and there is no upload flow, so this is the
 * honest empty state — the download button stays disabled, and uploads are not offered at all.
 */
export function StudentDocumentsTab({ profile, documents }: StudentDocumentsTabProps) {
  const school = useCurrentSchool()

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Documents"
        description="Certificates, transfer papers and report cards held for this student."
        action={
          <DownloadSheetButton
            label="Download document index PDF"
            disabled={documents.length === 0}
            disabledReason="No documents to export yet"
            run={async () => {
              const { downloadDocumentsPdf } = await import('@/features/students/lib/studentPdf')
              await downloadDocumentsPdf({ schoolName: school.data?.name ?? 'School', profile, documents })
            }}
          />
        }
      />

      {documents.length === 0 ? (
        <section className="border-line bg-surface flex flex-col items-center rounded-xl border px-6 py-14 text-center shadow-[var(--shadow-card)]">
          <span className="bg-primary-soft text-primary inline-flex size-12 items-center justify-center rounded-full">
            <FileText className="size-5" strokeWidth={1.75} />
          </span>
          <p className="text-ink mt-4 text-[15px] font-medium">No documents uploaded yet</p>
          <p className="text-ink-muted mt-1 max-w-sm text-[13px]">
            Birth certificates, transfer papers and report cards will be listed here once uploads land.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {documents.map((document) => (
            <article
              key={document.id}
              className="border-line bg-surface flex items-center gap-3 rounded-xl border p-4 shadow-[var(--shadow-card)]">
              <span className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[14px] font-medium">{document.title}</p>
                <p className="text-ink-muted text-[12px]">
                  {document.kind} · {document.sizeKb} KB
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

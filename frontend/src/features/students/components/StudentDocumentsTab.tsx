import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { FileText, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { useCurrentSchool } from '@/features/school/api'
import { DownloadSheetButton, StudentTabHeader } from '@/features/students/components/DownloadSheetButton'
import type { StudentDocument, StudentProfile } from '@/types/people'

interface StudentDocumentsTabProps {
  profile: StudentProfile
  documents: StudentDocument[]
}

/**
 * Documents. The upload control is wired to a real file picker but nothing is stored yet — it says
 * so plainly rather than pretending. Once the documents endpoint lands, only `handlePicked` changes.
 */
export function StudentDocumentsTab({ profile, documents }: StudentDocumentsTabProps) {
  const school = useCurrentSchool()
  const { toast } = useToast()
  const fileInput = useRef<HTMLInputElement>(null)

  function handlePicked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset first, so choosing the same file twice still fires a change event.
    event.target.value = ''
    if (!file) return

    toast({
      tone: 'info',
      title: 'Uploads are not connected yet',
      description: `${file.name} was not stored — this lands with the documents endpoint.`,
    })
  }

  return (
    <div className="space-y-5">
      <StudentTabHeader
        title="Documents"
        description="Certificates, transfer papers and report cards held for this student."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" strokeWidth={1.75} />
              Upload document
            </Button>

            <DownloadSheetButton
              label="Download document index PDF"
              disabled={documents.length === 0}
              disabledReason="No documents to export yet"
              run={async () => {
                const { downloadDocumentsPdf } = await import('@/features/students/lib/studentPdf')
                await downloadDocumentsPdf({ schoolName: school.data?.name ?? 'School', profile, documents })
              }}
            />
          </div>
        }
      />

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        aria-label="Choose a document to upload"
        onChange={handlePicked}
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

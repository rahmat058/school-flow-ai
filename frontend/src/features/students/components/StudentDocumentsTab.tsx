import { FileText } from 'lucide-react'
import type { StudentDocument } from '@/types/people'

interface StudentDocumentsTabProps {
  documents: StudentDocument[]
}

/**
 * Documents. Nothing is stored against a student yet and there is no upload flow, so this is the
 * honest empty state — no button that would go nowhere.
 */
export function StudentDocumentsTab({ documents }: StudentDocumentsTabProps) {
  if (documents.length === 0) {
    return (
      <section className="border-line bg-surface flex flex-col items-center rounded-xl border px-6 py-14 text-center shadow-[var(--shadow-card)]">
        <span className="bg-primary-soft text-primary inline-flex size-12 items-center justify-center rounded-full">
          <FileText className="size-5" strokeWidth={1.75} />
        </span>
        <p className="text-ink mt-4 text-[15px] font-medium">No documents uploaded yet</p>
        <p className="text-ink-muted mt-1 max-w-sm text-[13px]">
          Birth certificates, transfer papers and report cards will be listed here once uploads land.
        </p>
      </section>
    )
  }

  return (
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
  )
}

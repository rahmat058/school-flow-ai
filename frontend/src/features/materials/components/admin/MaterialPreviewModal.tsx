import { Download, FileWarning } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/apiClient'
import { useMaterialDetail } from '@/features/materials/api'
import { previewKindOf } from '@/features/materials/lib/preview'
import type { MaterialListItem } from '@/types/materials'

interface MaterialPreviewModalProps {
  /** The row being previewed; `null` closes the modal. */
  material: MaterialListItem | null
  onClose: () => void
  onDownload: (material: MaterialListItem) => void
}

/**
 * The material's file, shown in place rather than handed to the browser as a download. Nothing is
 * fetched until a row is picked, and the signed URL is the same one the download uses.
 */
export function MaterialPreviewModal({ material, onClose, onDownload }: MaterialPreviewModalProps) {
  const detail = useMaterialDetail(material?.id ?? null)

  return (
    <Modal
      open={material !== null}
      onClose={onClose}
      title={material?.title ?? ''}
      description={material ? `${material.subjectName} · Class ${material.className}` : undefined}
      size="lg"
      className="max-w-4xl"
      footer={
        material ? (
          <Button onClick={() => onDownload(material)}>
            <Download className="size-4" strokeWidth={1.75} />
            Download
          </Button>
        ) : null
      }>
      {detail.isError ? (
        <Alert tone="error" title="Could not prepare this preview">
          {detail.error instanceof ApiError ? detail.error.message : 'Please try again.'}
        </Alert>
      ) : detail.data ? (
        <PreviewSurface url={detail.data.signedUrl} title={detail.data.title} />
      ) : (
        <Skeleton className="h-[70vh] rounded-lg" />
      )}
    </Modal>
  )
}

/** PDFs frame, images scale, and anything else explains itself — a DOCX has no browser viewer. */
function PreviewSurface({ url, title }: { url: string; title: string }) {
  const kind = previewKindOf(url)

  if (kind === 'PDF') {
    return (
      <iframe
        src={url}
        title={`Preview of ${title}`}
        className="border-line bg-canvas h-[70vh] w-full rounded-lg border"
      />
    )
  }

  if (kind === 'IMAGE') {
    return <img src={url} alt={title} className="border-line mx-auto max-h-[70vh] rounded-lg border" />
  }

  return (
    <EmptyState
      icon={FileWarning}
      title="This file cannot be previewed"
      description="Word documents have no in-browser viewer — download the file to open it."
    />
  )
}

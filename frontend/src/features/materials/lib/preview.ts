/** How the browser can show a stored file, derived from its URL. */
export type MaterialPreviewKind = 'PDF' | 'IMAGE' | 'UNSUPPORTED'

/**
 * The upload rule allows PDF/JPG/PNG/DOCX (`lib/validation.ts`), and only the first three render
 * inline — a DOCX has no browser viewer, so it falls back to the download action rather than a blank
 * frame. The extension comes off the stored URL, since the material's `type` (notes, worksheet, …) is
 * the school's own label and says nothing about the file format.
 */
export function previewKindOf(url: string): MaterialPreviewKind {
  const extension = url.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'pdf') return 'PDF'
  if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') return 'IMAGE'
  return 'UNSUPPORTED'
}

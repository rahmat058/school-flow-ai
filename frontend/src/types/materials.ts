export type MaterialType = 'PDF' | 'NOTES' | 'WORKSHEET' | 'PAPER'

export interface StudyMaterial {
  id: string
  schoolId: string
  classId: string
  subjectId: string
  uploadedById: string
  title: string
  description: string | null
  type: MaterialType
  fileUrl: string
  fileSizeBytes: number | null
  createdAt: string
  updatedAt: string
  /** Soft delete (`Database.md` §6): the row survives, the library stops listing it. */
  deletedAt: string | null
}

/**
 * Read model for the materials library — the upload plus its joined class, subject and author.
 * Computed in the API layer (or the mock adapter standing in for it), never in the view.
 */
export interface MaterialListItem {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  uploadedById: string
  uploadedByName: string
  title: string
  description: string | null
  type: MaterialType
  fileUrl: string
  fileSizeBytes: number | null
  createdAt: string
}

/** `GET /materials/:id` — the row plus the short-lived URL the file is actually fetched from. */
export interface MaterialDetail extends MaterialListItem {
  signedUrl: string
}

/** What the upload form sends as multipart. Author, school and the stored URL are the server's job. */
export interface MaterialUpload {
  classId: string
  subjectId: string
  title: string
  description: string | null
  type: MaterialType
  file: File
}

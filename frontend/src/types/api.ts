/** Shapes shared by every endpoint, mirroring `docs/backend/Design.md`. */

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

/** Success envelope: `{ success: true, data, meta }` — `meta` only on paginated lists. */
export interface ApiEnvelope<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: string[]
}

/** Error envelope: `{ success: false, error: { code, message } }` — codes are SCREAMING_SNAKE. */
export interface ApiErrorEnvelope {
  success: false
  error: ApiErrorBody
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

/** Query params accepted by every paginated list endpoint. */
export interface ListQuery {
  page?: number
  limit?: number
  search?: string
}

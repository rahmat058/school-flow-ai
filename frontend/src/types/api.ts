/** Shapes shared by every endpoint, mirroring `docs/backend/Design.md`. */

export interface PaginationLinks {
  self: string
  first: string
  last: string
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPage: number
  links: PaginationLinks
}

/** Links attached to a single-resource response (`GET`/`POST`/`PATCH` on `/resource/:id`). */
export interface ResourceLinks {
  self: string
  get: string
  update: string
  delete: string
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

/** Error envelope: `{ success: false, statusCode, error: { code, message } }` — codes are SCREAMING_SNAKE. */
export interface ApiErrorEnvelope {
  success: false
  statusCode: number
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

import { env } from '@/lib/env'
import axios, { AxiosError } from 'axios'
import type { AxiosInstance } from 'axios'
import { getAccessToken, useAuthStore } from '@/store/auth'
import { createMockAdapter } from '@/services/mockAdapter'
import type { ApiEnvelope, ApiErrorBody, ApiErrorEnvelope, PaginationMeta } from '@/types/api'

/**
 * Normalised API failure. Every rejection out of this client is an `ApiError`, so callers never deal
 * with axios internals and can branch on `code` (SCREAMING_SNAKE, per `docs/backend/Design.md`).
 */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details: string[]

  constructor(body: ApiErrorBody, status: number) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.status = status
    this.details = body.details ?? []
  }
}

/** The unwrapped envelope: `data`, plus `meta` when the endpoint paginates. */
export interface ApiResult<T> {
  data: T
  meta?: PaginationMeta
}

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  return typeof value === 'object' && value !== null && (value as ApiErrorEnvelope).success === false
}

function unwrap<T>(envelope: ApiEnvelope<T>): ApiResult<T> {
  if (!envelope || envelope.success !== true) {
    throw new ApiError({ code: 'INVALID_ENVELOPE', message: 'Unexpected response shape from the API' }, 500)
  }
  return { data: envelope.data, meta: envelope.meta }
}

function buildClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: env.apiUrl,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
    // With mocks enabled the demo answers locally — through these same interceptors, so the request
    // path is identical to a live backend.
    ...(env.enableMocks ? { adapter: createMockAdapter() } : {}),
  })

  instance.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorEnvelope>) => {
      if (error.response) {
        const body = error.response.data
        const status = error.response.status
        const normalised = isErrorEnvelope(body)
          ? new ApiError(body.error, status)
          : new ApiError({ code: 'UNKNOWN_ERROR', message: error.message || 'Request failed' }, status)

        // A dead session must not be cached client-side: drop it so the guards redirect to /login.
        if (status === 401 && !String(error.config?.url).startsWith('/auth')) {
          useAuthStore.getState().clearSession()
        }

        return Promise.reject(normalised)
      }

      return Promise.reject(
        new ApiError({ code: 'NETWORK_ERROR', message: 'Could not reach the server. Check your connection.' }, 0),
      )
    },
  )

  return instance
}

export const http = buildClient()

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResult<T>> {
  const response = await http.get<ApiEnvelope<T>>(url, { params })
  return unwrap(response.data)
}

export async function post<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await http.post<ApiEnvelope<T>>(url, body)
  return unwrap(response.data)
}

export async function put<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await http.put<ApiEnvelope<T>>(url, body)
  return unwrap(response.data)
}

export async function patch<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await http.patch<ApiEnvelope<T>>(url, body)
  return unwrap(response.data)
}

export async function remove<T>(url: string): Promise<ApiResult<T>> {
  const response = await http.delete<ApiEnvelope<T>>(url)
  return unwrap(response.data)
}

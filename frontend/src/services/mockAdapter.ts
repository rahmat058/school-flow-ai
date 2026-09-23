import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiEnvelope, PaginationMeta } from '@/types/api'
import type { AuthSession, AuthUser, OtpChallenge } from '@/types/auth'
import type { ClassOption } from '@/types/academic'
import type { FeeCollectionSummary, FeeInvoiceListItem, InvoiceStatus } from '@/types/fees'
import type { Notice } from '@/types/communication'
import type { StudentListItem, Teacher } from '@/types/people'
import { activeSchool } from '@/data/school'
import { classLabel, classes } from '@/data/classes'
import { teachers } from '@/data/teachers'
import { students } from '@/data/students'
import { parents, parentStudents } from '@/data/parents'
import { feeInvoices } from '@/data/fees'
import { notices } from '@/data/notices'
import { dashboardSummary } from '@/data/dashboard'
import { demoAccounts, users } from '@/data/users'

/**
 * Demo API. Answers requests from `src/data/*` with the real response envelope and realistic
 * latency, so the axios interceptors, TanStack Query hooks and components all run the same code path
 * they will use against the NestJS backend. Disable with `VITE_ENABLE_MOCKS=false`.
 *
 * Delete this file once the backend exists — nothing else changes.
 */

const OTP_CODE = '123456'
const REFRESH_KEY = 'school-flow.demo-refresh-user'

// ---------------------------------------------------------------------------------------------
// session shim: stands in for the httpOnly refresh cookie (browsers) or module memory (Node)
// ---------------------------------------------------------------------------------------------
const memoryStore = new Map<string, string>()

/** Browsers have sessionStorage; Node (the integration test) does not — fall back to memory. */
function browserStorage(): Storage | null {
  try {
    return typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage
  } catch {
    return null
  }
}

const sessionShim = {
  get(key: string): string | null {
    const storage = browserStorage()
    return storage ? storage.getItem(key) : (memoryStore.get(key) ?? null)
  },
  set(key: string, value: string): void {
    const storage = browserStorage()
    if (storage) storage.setItem(key, value)
    else memoryStore.set(key, value)
  },
  remove(key: string): void {
    const storage = browserStorage()
    if (storage) storage.removeItem(key)
    else memoryStore.delete(key)
  },
}

// ---------------------------------------------------------------------------------------------
// request/response plumbing
// ---------------------------------------------------------------------------------------------
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface MockRequest {
  method: HttpMethod
  path: string
  body: Record<string, unknown>
  params: Record<string, unknown>
  userId: string | null
}

interface MockResult {
  status: number
  body: unknown
}

type RouteHandler = (request: MockRequest) => MockResult

interface Route {
  method: HttpMethod
  path: string
  handler: RouteHandler
}

function ok<T>(data: T, meta?: PaginationMeta): MockResult {
  const envelope: ApiEnvelope<T> = meta ? { success: true, data, meta } : { success: true, data }
  return { status: 200, body: envelope }
}

function created<T>(data: T): MockResult {
  return { status: 201, body: { success: true, data } }
}

function fail(status: number, code: string, message: string, details?: string[]): MockResult {
  return { status, body: { success: false, error: { code, message, ...(details ? { details } : {}) } } }
}

function normalizePath(config: InternalAxiosRequestConfig): string {
  let path = config.url ?? ''
  const base = config.baseURL ?? ''
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path.startsWith('/')) path = `/${path}`
  return path.replace(/\/+$/, '') || '/'
}

function parseBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  const { data } = config
  if (!data) return {}
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return data as Record<string, unknown>
}

function readToken(config: InternalAxiosRequestConfig): string | null {
  const headers = config.headers as unknown as { get?: (name: string) => string | null }
  const raw = headers?.get?.('Authorization') ?? null
  if (!raw?.startsWith('Bearer ')) return null
  return raw.slice('Bearer '.length)
}

/** Separator is `.` because user ids contain underscores (`usr_admin_1`). */
function userIdFromToken(token: string | null): string | null {
  if (!token?.startsWith('token.')) return null
  const parts = token.split('.')
  return parts.length >= 3 ? parts[1] : null
}

function tokenFor(userId: string): string {
  return `token.${userId}.${Date.now()}`
}

function sessionFor(user: AuthUser): AuthSession {
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString()
  return { user, accessToken: tokenFor(user.id), expiresAt }
}

function delayFor(path: string): Promise<void> {
  const ms = 140 + (path.length % 5) * 60
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------------------------
// query helpers
// ---------------------------------------------------------------------------------------------
function paginate<T>(items: T[], params: Record<string, unknown>): { items: T[]; meta: PaginationMeta } {
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = Math.max(1, Number(params.limit ?? 10))
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), meta: { page, limit, total: items.length } }
}

function searchTerm(params: Record<string, unknown>): string {
  return String(params.search ?? '')
    .trim()
    .toLowerCase()
}

function matches(needle: string, values: Array<string | null | undefined>): boolean {
  if (!needle) return true
  return values.some((value) => value?.toLowerCase().includes(needle))
}

function studentListItems(): StudentListItem[] {
  return students.map((student) => {
    const classRoom = classes.find((item) => item.id === student.classId)
    const primaryLink = parentStudents.find((link) => link.studentId === student.id && link.isPrimary)
    const guardian = primaryLink ? parents.find((parent) => parent.id === primaryLink.parentId) : undefined

    return {
      ...student,
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
      guardianName: guardian ? `${guardian.firstName} ${guardian.lastName}` : null,
    }
  })
}

function invoiceListItems(): FeeInvoiceListItem[] {
  return feeInvoices.map((invoice) => {
    const student = students.find((item) => item.id === invoice.studentId)
    const classRoom = classes.find((item) => item.id === student?.classId)

    return {
      ...invoice,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown student',
      admissionNo: student?.admissionNo ?? '—',
      className: classRoom ? classLabel(classRoom) : 'Unassigned',
    }
  })
}

// ---------------------------------------------------------------------------------------------
// demo-only account store, so the signup flow can be completed without a backend
// ---------------------------------------------------------------------------------------------
interface PendingRegistration {
  email: string
  password: string
  firstName: string
  lastName: string
}

const pendingRegistrations = new Map<string, PendingRegistration>()

function syntheticAdmin(registration: PendingRegistration): AuthUser {
  return {
    id: `usr_admin_${registration.email}`,
    email: registration.email,
    role: 'ADMIN',
    schoolId: activeSchool.id,
    isVerified: true,
    profileId: null,
    firstName: registration.firstName,
    lastName: registration.lastName,
    classId: null,
  }
}

function resolveLogin(email: string, password: string): AuthUser | null {
  const account = demoAccounts.find((item) => item.email.toLowerCase() === email.toLowerCase())
  if (account && account.password === password) {
    return users.find((user) => user.id === account.userId) ?? null
  }

  const registration = pendingRegistrations.get(email.toLowerCase())
  if (registration && registration.password === password) return syntheticAdmin(registration)

  return null
}

// ---------------------------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------------------------
const routes: Route[] = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
      const password = String(body.password ?? '')
      const user = resolveLogin(email, password)

      if (!user) {
        return fail(401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect')
      }

      sessionShim.set(REFRESH_KEY, user.id)
      return ok(sessionFor(user))
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: () => {
      const userId = sessionShim.get(REFRESH_KEY)
      const user = users.find((item) => item.id === userId)

      if (!user) return fail(401, 'AUTH_SESSION_EXPIRED', 'Your session has expired. Please sign in again.')
      return ok(sessionFor(user))
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: () => {
      sessionShim.remove(REFRESH_KEY)
      return ok({ loggedOut: true })
    },
  },
  {
    method: 'GET',
    path: '/auth/me',
    handler: ({ userId }) => {
      const user = users.find((item) => item.id === userId)
      if (!user) return fail(401, 'AUTH_UNAUTHENTICATED', 'Not signed in')
      return ok(user)
    },
  },
  {
    method: 'POST',
    path: '/auth/forgot-password',
    handler: ({ body }) => {
      const email = String(body.email ?? '').trim()
      // Never reveal whether an account exists.
      return ok({ email, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() })
    },
  },
  {
    method: 'POST',
    path: '/auth/reset-password',
    handler: ({ body }) => {
      const token = String(body.token ?? '')
      const password = String(body.password ?? '')

      if (token === 'expired') return fail(400, 'AUTH_RESET_TOKEN_INVALID', 'This reset link has expired')
      if (password.length < 8) {
        return fail(400, 'VALIDATION_ERROR', 'Password does not meet the requirements', [
          'password must be at least 8 characters',
        ])
      }

      return ok({ reset: true })
    },
  },
  {
    method: 'POST',
    path: '/schools/register',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()
      const password = String(body.password ?? '')

      if (demoAccounts.some((account) => account.email.toLowerCase() === email) || pendingRegistrations.has(email)) {
        return fail(409, 'SCHOOL_EMAIL_TAKEN', 'That email is already registered')
      }

      pendingRegistrations.set(email, {
        email,
        password,
        firstName: String(body.adminFirstName ?? 'School'),
        lastName: String(body.adminLastName ?? 'Admin'),
      })

      const challenge: OtpChallenge = {
        email,
        purpose: 'REGISTER',
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      }

      return created({ schoolId: activeSchool.id, email, otp: challenge })
    },
  },
  {
    method: 'POST',
    path: '/schools/verify-otp',
    handler: ({ body }) => {
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase()
      const code = String(body.code ?? '')

      if (code !== OTP_CODE) {
        return fail(400, 'AUTH_OTP_INVALID', `That code is not correct. Use ${OTP_CODE} in the demo.`)
      }

      return ok({ email, verified: true })
    },
  },
  {
    method: 'POST',
    path: '/schools/resend-otp',
    handler: () => ok({ sent: true, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() }),
  },
  { method: 'GET', path: '/schools/current', handler: () => ok(activeSchool) },
  { method: 'GET', path: '/dashboard/admin', handler: () => ok(dashboardSummary) },
  {
    method: 'GET',
    path: '/classes',
    handler: () =>
      ok<ClassOption[]>(
        classes.map((classRoom) => ({
          id: classRoom.id,
          label: classLabel(classRoom),
          grade: classRoom.grade,
          section: classRoom.section,
        })),
      ),
  },
  {
    method: 'GET',
    path: '/teachers',
    handler: () => ok<Teacher[]>(teachers),
  },
  {
    method: 'GET',
    path: '/students',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const classId = params.classId ? String(params.classId) : ''

      const filtered = studentListItems()
        .filter((student) => (classId ? student.classId === classId : true))
        .filter((student) =>
          matches(term, [student.firstName, student.lastName, student.admissionNo, student.guardianName]),
        )
        .sort((left, right) => left.admissionNo.localeCompare(right.admissionNo))

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/notices',
    handler: ({ params }) => {
      const term = searchTerm(params)

      const filtered = [...notices]
        .filter((notice) => matches(term, [notice.title, notice.body]))
        .sort((left, right) => (right.publishedAt ?? '').localeCompare(left.publishedAt ?? ''))

      const { items, meta } = paginate(filtered, params)
      return ok<Notice[]>(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/invoices',
    handler: ({ params }) => {
      const term = searchTerm(params)
      const status = params.status ? String(params.status) : ''

      const filtered = invoiceListItems()
        .filter((invoice) => (status ? invoice.status === status : true))
        .filter((invoice) =>
          matches(term, [invoice.studentName, invoice.admissionNo, invoice.receiptNo, invoice.className]),
        )
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/pending',
    handler: ({ params }) => {
      const open: InvoiceStatus[] = ['PENDING', 'PARTIAL', 'OVERDUE']
      const filtered = invoiceListItems()
        .filter((invoice) => open.includes(invoice.status))
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate))

      const { items, meta } = paginate(filtered, params)
      return ok(items, meta)
    },
  },
  {
    method: 'GET',
    path: '/fees/summary',
    handler: () => {
      const invoices = invoiceListItems()
      const summary: FeeCollectionSummary = {
        collectedPaise: invoices.reduce((total, invoice) => total + invoice.paidPaise, 0),
        pendingPaise: invoices.reduce(
          (total, invoice) => total + Math.max(invoice.amountPaise - invoice.discountPaise - invoice.paidPaise, 0),
          0,
        ),
        overdueCount: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
        concessionPaise: invoices.reduce((total, invoice) => total + invoice.discountPaise, 0),
      }

      return ok(summary)
    },
  },
]

/** Every route except the auth handshake needs a bearer token, exactly like the real API. */
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/schools/register',
  '/schools/verify-otp',
  '/schools/resend-otp',
])

function buildResponse(config: InternalAxiosRequestConfig, status: number, body: unknown): AxiosResponse {
  return {
    data: body,
    status,
    statusText: status < 400 ? 'OK' : 'Error',
    headers: {},
    config,
  }
}

function buildError(config: InternalAxiosRequestConfig, result: MockResult): AxiosError {
  const response = buildResponse(config, result.status, result.body)
  const message = (result.body as { error?: { message?: string } })?.error?.message ?? 'Request failed'
  return new AxiosError(message, `E${result.status}`, config, null, response)
}

export function createMockAdapter(): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? 'get').toUpperCase() as HttpMethod
    const path = normalizePath(config)
    const token = readToken(config)
    const params = (config.params ?? {}) as Record<string, unknown>

    await delayFor(path)

    const route = routes.find((item) => item.method === method && item.path === path)
    if (!route) {
      throw buildError(config, fail(404, 'NOT_FOUND', `No mock route for ${method} ${path}`))
    }

    const userId = userIdFromToken(token)
    if (!PUBLIC_PATHS.has(path) && !userId) {
      throw buildError(config, fail(401, 'AUTH_UNAUTHENTICATED', 'Missing or invalid access token'))
    }

    const result = route.handler({ method, path, body: parseBody(config), params, userId })
    if (result.status >= 400) throw buildError(config, result)

    return buildResponse(config, result.status, result.body)
  }
}

/** Exposed for the demo credentials card. */
export const mockConfig = { otpCode: OTP_CODE, refreshKey: REFRESH_KEY }

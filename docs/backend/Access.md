# Access — Backend

Every request is authenticated first and authorised second. Authentication is a bearer token:
the client sends `Authorization: Bearer <accessToken>`, the mock parses the caller's user id out
of the token (`token.<userId>.<nonce>`) and rejects any non-public path that arrives without one
with `401 AUTH_UNAUTHENTICATED`. Authorisation is a **role** plus, for a person's own data, an
**ownership check**: a role decides whether an account may open a class of routes at all, while a
`?studentId=` parameter or a `:studentId` path segment is answered only when the id names the
caller themselves (a student) or one of the caller's own children (a guardian). The mock role-gates
a small minority of routes; the rest are token-only, so this file records what the mock enforces
rather than what the contract intends. Source of truth: `frontend/src/services/mockAdapter.ts` (the
route table and its handlers), `frontend/src/lib/navigation.ts` (sidebar), `frontend/src/routes/`
(the client guards) and `frontend/src/store/auth.ts` (the session).

## 1. Roles

The `role` enum has four values (`frontend/src/types/auth.ts`). Two shared groupings are declared in
`frontend/src/lib/navigation.ts` and drive the sidebar; they are not server concepts.

| Role      | Constant                         | Purpose                                                                                                                                                                       |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`   | `EVERYONE`, `STAFF_AND_STUDENTS` | Owns the school: settings, staff and student records, classes, subjects, timetables, exams, the permission editor and every report. Has no personal record of its own.        |
| `TEACHER` | `EVERYONE`, `STAFF_AND_STUDENTS` | Works the school's records: reads the roster, marks the register, authors homework and materials, enters and publishes marks. Has a `profileId` pointing at a `teachers` row. |
| `STUDENT` | `EVERYONE`, `STAFF_AND_STUDENTS` | Reads their own slice: their class's homework, materials and timetable, their own attendance, marks, progress and fees. Carries a `classId`.                                  |
| `PARENT`  | `EVERYONE`                       | A guardian; reads one of their **own** children at a time. Excluded from `STAFF_AND_STUDENTS`, so their sidebar is narrower.                                                  |

| Grouping             | Members                         | Meaning                                                                            |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `EVERYONE`           | ADMIN, TEACHER, STUDENT, PARENT | All four roles — the nav items shown to every signed-in user.                      |
| `STAFF_AND_STUDENTS` | ADMIN, TEACHER, STUDENT         | Everyone who works with the school's records; a guardian reads a narrower sidebar. |

## 2. Navigation per role

The sidebar is filtered by `navItemsForRole(role)` against each item's `roles`. Two items point at
the same `href` (`/exams`): **Results** is the guardian's view of a child's published marks, while
**Tests & exams** is the staff/student screen — a different page behind one path. Labels are exact.

**ADMIN** (16 items) — Dashboard · Students · Teachers · Attendance · Fees · Homework · Tests &
exams · Timetable · Study Materials · Notices · Communication · AI Assistant · Reports · Roles &
permissions · Subject & Class · Settings.

**TEACHER** (11 items) — Dashboard · Students · Attendance · Homework · Tests & exams · Timetable ·
Study Materials · Notices · Communication · AI Assistant · Reports.

**STUDENT** (11 items) — Dashboard · Attendance · Homework · Tests & exams · My Reports · Progress ·
Timetable · Study Materials · Notices · Communication · AI Assistant.

**PARENT** (5 items) — Dashboard · Attendance · Results · Fees · Notices.

| Label               | `href`             | Visible to              |
| ------------------- | ------------------ | ----------------------- |
| Dashboard           | `/`                | EVERYONE                |
| Students            | `/students`        | ADMIN, TEACHER          |
| Teachers            | `/teachers`        | ADMIN                   |
| Attendance          | `/attendance`      | EVERYONE                |
| Results             | `/exams`           | PARENT                  |
| Fees                | `/fees`            | ADMIN, PARENT           |
| Homework            | `/homework`        | STAFF_AND_STUDENTS      |
| Tests & exams       | `/exams`           | STAFF_AND_STUDENTS      |
| My Reports          | `/my-reports`      | STUDENT                 |
| Progress            | `/progress`        | STUDENT                 |
| Timetable           | `/timetable`       | STAFF_AND_STUDENTS      |
| Study Materials     | `/study-materials` | STAFF_AND_STUDENTS      |
| Notices             | `/notices`         | EVERYONE                |
| Communication       | `/chat`            | STAFF_AND_STUDENTS      |
| AI Assistant        | `/ai`              | ADMIN, TEACHER, STUDENT |
| Reports             | `/reports`         | ADMIN, TEACHER          |
| Roles & permissions | `/permissions`     | ADMIN                   |
| Subject & Class     | `/subjects`        | ADMIN                   |
| Settings            | `/settings`        | ADMIN                   |

The sidebar is curation, not capability: a guardian does not see Homework, Timetable, Study
Materials or Communication, but the API still role-scopes those routes and they remain reachable by
URL.

## 3. Route access

The 109 routes in the mock's `routes` table, by domain. **Roles** is the scope the contract
(`PRD.md` §2 and §4) states; **Enforced?** says whether the mock actually applies it.

- `standard` — the mock enforces the documented access level: a public route needs no token; a
  role-gated route refuses the wrong role; an `authenticated`/`participant`/all-roles route is gated
  by the token (or the participation check), which is exactly what its contract asks for.
- `intended only` — the contract restricts the route to a strict subset of the four roles but the
  mock applies no role check; **any valid bearer token is accepted**.

A `401 AUTH_UNAUTHENTICATED` is returned by every route below except the nine public ones, and is
not repeated in the tables. `:param` segments are path params; the last column lists the query
params each handler reads (`page`/`limit` are read by the `paginate` helper).

### Auth

| Method | Path                    | Roles              | 403 — code + condition                                                 | Enforced?     | Query params |
| ------ | ----------------------- | ------------------ | ---------------------------------------------------------------------- | ------------- | ------------ |
| POST   | `/auth/login`           | public             | `AUTH_NOT_VERIFIED` — the account exists but its invite is unconfirmed | standard      | —            |
| POST   | `/auth/refresh`         | public             | —                                                                      | standard      | —            |
| POST   | `/auth/logout`          | session (contract) | —                                                                      | intended only | —            |
| GET    | `/auth/me`              | any authenticated  | —                                                                      | standard      | —            |
| POST   | `/auth/forgot-password` | public             | —                                                                      | standard      | —            |
| POST   | `/auth/reset-password`  | public             | —                                                                      | standard      | —            |
| POST   | `/auth/verify-invite`   | public             | —                                                                      | standard      | —            |

`/auth/logout` is in the mock's `PUBLIC_PATHS` — it needs no token although the contract requires a
session. It is the one `intended only` route whose gap is authentication rather than a role.

### School

| Method | Path                        | Roles   | 403 — code + condition | Enforced?     | Query params |
| ------ | --------------------------- | ------- | ---------------------- | ------------- | ------------ |
| POST   | `/schools/register`         | public  | —                      | standard      | —            |
| POST   | `/schools/verify-otp`       | public  | —                      | standard      | —            |
| POST   | `/schools/resend-otp`       | public  | —                      | standard      | —            |
| GET    | `/schools/current`          | `ADMIN` | —                      | intended only | —            |
| PATCH  | `/schools/current`          | `ADMIN` | —                      | intended only | —            |
| PATCH  | `/schools/current/settings` | `ADMIN` | —                      | intended only | —            |
| POST   | `/schools/current/backup`   | `ADMIN` | —                      | intended only | —            |

### Users

| Method | Path                         | Roles   | 403 — code + condition | Enforced?     | Query params |
| ------ | ---------------------------- | ------- | ---------------------- | ------------- | ------------ |
| GET    | `/users/:userId/permissions` | `ADMIN` | —                      | intended only | —            |
| PUT    | `/users/:userId/permissions` | `ADMIN` | —                      | intended only | —            |

### Teachers

| Method | Path            | Roles   | 403 — code + condition | Enforced?     | Query params |
| ------ | --------------- | ------- | ---------------------- | ------------- | ------------ |
| GET    | `/teachers`     | `ADMIN` | —                      | intended only | `search`     |
| POST   | `/teachers`     | `ADMIN` | —                      | intended only | —            |
| PATCH  | `/teachers/:id` | `ADMIN` | —                      | intended only | —            |
| DELETE | `/teachers/:id` | `ADMIN` | —                      | intended only | —            |

### Students

| Method | Path                      | Roles                                    | 403 — code + condition | Enforced?     | Query params                                        |
| ------ | ------------------------- | ---------------------------------------- | ---------------------- | ------------- | --------------------------------------------------- |
| GET    | `/students`               | `ADMIN`                                  | —                      | intended only | `search`, `classId`, `feeStanding`, `page`, `limit` |
| POST   | `/students`               | `ADMIN`                                  | —                      | intended only | —                                                   |
| GET    | `/students/:id`           | `ADMIN`, `TEACHER`, `PARENT` (own child) | —                      | intended only | —                                                   |
| PATCH  | `/students/:id`           | `ADMIN`                                  | —                      | intended only | —                                                   |
| DELETE | `/students/:id`           | `ADMIN`                                  | —                      | intended only | —                                                   |
| GET    | `/students/:id/documents` | `ADMIN`, `TEACHER`, `PARENT` (own child) | —                      | intended only | —                                                   |

`GET /students/:id` carries **no** ownership check: any valid token reads any student's profile.

### Classes

| Method | Path       | Roles   | 403 — code + condition | Enforced?     | Query params |
| ------ | ---------- | ------- | ---------------------- | ------------- | ------------ |
| GET    | `/classes` | `ADMIN` | —                      | intended only | —            |

### Subjects

| Method | Path                                        | Roles              | 403 — code + condition | Enforced?     | Query params           |
| ------ | ------------------------------------------- | ------------------ | ---------------------- | ------------- | ---------------------- |
| GET    | `/subjects`                                 | `ADMIN`, `TEACHER` | —                      | intended only | `classId`, `teacherId` |
| GET    | `/subjects/overview`                        | `ADMIN`            | —                      | intended only | —                      |
| GET    | `/subjects/summary`                         | `ADMIN`            | —                      | intended only | —                      |
| GET    | `/subjects/assignments`                     | `ADMIN`            | —                      | intended only | `classId`              |
| POST   | `/subjects/assignments`                     | `ADMIN`            | —                      | intended only | —                      |
| POST   | `/subjects/assignments/bulk`                | `ADMIN`            | —                      | intended only | —                      |
| DELETE | `/subjects/assignments/:classId/:subjectId` | `ADMIN`            | —                      | intended only | —                      |
| POST   | `/subjects`                                 | `ADMIN`            | —                      | intended only | —                      |
| PATCH  | `/subjects/:id`                             | `ADMIN`            | —                      | intended only | —                      |
| DELETE | `/subjects/:id`                             | `ADMIN`            | —                      | intended only | —                      |

### Attendance

| Method | Path                             | Roles                                                     | 403 — code + condition                                                                     | Enforced?     | Query params         |
| ------ | -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- | -------------------- |
| GET    | `/attendance/me`                 | `STUDENT` (own), `PARENT` (own child)                     | `ATTENDANCE_FORBIDDEN` — the caller is staff, or `studentId` is not the caller/their child | standard      | `studentId`, `month` |
| GET    | `/attendance/monthly`            | `ADMIN`, `TEACHER`                                        | `ATTENDANCE_FORBIDDEN` — the caller is a student or guardian                               | standard      | `classId`, `month`   |
| GET    | `/attendance`                    | `ADMIN`, `TEACHER`                                        | `ATTENDANCE_FORBIDDEN` — the caller is a student or guardian                               | standard      | `classId`, `date`    |
| POST   | `/attendance`                    | `ADMIN`, `TEACHER`                                        | `ATTENDANCE_FORBIDDEN` — the caller is a student or guardian                               | standard      | —                    |
| GET    | `/attendance/student/:studentId` | `ADMIN`, `TEACHER`, `STUDENT` (own), `PARENT` (own child) | —                                                                                          | intended only | —                    |

### Homework

| Method | Path            | Roles                             | 403 — code + condition | Enforced?     | Query params                               |
| ------ | --------------- | --------------------------------- | ---------------------- | ------------- | ------------------------------------------ |
| GET    | `/homework`     | all four roles (rows role-scoped) | —                      | standard      | `classId`, `subjectId`, `status`, `search` |
| POST   | `/homework`     | `ADMIN`, `TEACHER`                | —                      | intended only | —                                          |
| PATCH  | `/homework/:id` | `ADMIN`, `TEACHER`                | —                      | intended only | —                                          |
| DELETE | `/homework/:id` | `ADMIN`, `TEACHER`                | —                      | intended only | —                                          |

`GET /homework` does not refuse a role; it filters the rows instead (`homeworkVisibleTo`): staff see
the school, a student their class, a guardian their children's classes.

### Materials

| Method | Path             | Roles                             | 403 — code + condition | Enforced?     | Query params                             |
| ------ | ---------------- | --------------------------------- | ---------------------- | ------------- | ---------------------------------------- |
| GET    | `/materials`     | all four roles (rows role-scoped) | —                      | standard      | `classId`, `subjectId`, `type`, `search` |
| POST   | `/materials`     | `ADMIN`, `TEACHER`                | —                      | intended only | —                                        |
| GET    | `/materials/:id` | all four roles                    | —                      | standard      | —                                        |
| DELETE | `/materials/:id` | `ADMIN`, `TEACHER`                | —                      | intended only | —                                        |

`GET /materials` mirrors `/homework`: rows are filtered by role (`materialVisibleTo`), not refused.

### Timetable

| Method | Path                                             | Roles                        | 403 — code + condition                                            | Enforced?     | Query params |
| ------ | ------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------- | ------------- | ------------ |
| GET    | `/timetables/class/:classId`                     | all four roles               | —                                                                 | standard      | —            |
| PATCH  | `/timetables/class/:classId/slots`               | `ADMIN`                      | —                                                                 | intended only | —            |
| POST   | `/timetables/class/:classId/periods`             | `ADMIN`                      | —                                                                 | intended only | —            |
| DELETE | `/timetables/class/:classId/periods/:orderIndex` | `ADMIN`                      | —                                                                 | intended only | —            |
| GET    | `/timetables/me`                                 | any authenticated (per-role) | `TIMETABLE_FORBIDDEN` — `studentId` is not the caller/their child | standard      | `studentId`  |

### Exams

| Method | Path                          | Roles                                                     | 403 — code + condition                                                                 | Enforced?     | Query params                   |
| ------ | ----------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------- | ------------------------------ |
| GET    | `/exams`                      | all four roles                                            | —                                                                                      | standard      | `kind`, `classId`, `subjectId` |
| POST   | `/exams`                      | `ADMIN`, `TEACHER`                                        | —                                                                                      | intended only | —                              |
| GET    | `/exams/me`                   | `STUDENT` (own), `PARENT` (own child)                     | `EXAM_FORBIDDEN` — the caller is staff; `PARENT_FORBIDDEN` — `studentId` is not theirs | standard      | `studentId`                    |
| PATCH  | `/exams/:id`                  | `ADMIN`, `TEACHER`                                        | —                                                                                      | intended only | —                              |
| DELETE | `/exams/:id`                  | `ADMIN`                                                   | —                                                                                      | intended only | —                              |
| GET    | `/exams/:id/results`          | `ADMIN`, `TEACHER`                                        | —                                                                                      | intended only | —                              |
| POST   | `/exams/:id/marks`            | `ADMIN`, `TEACHER`                                        | —                                                                                      | intended only | —                              |
| POST   | `/exams/:id/publish`          | `ADMIN`, `TEACHER`                                        | —                                                                                      | intended only | —                              |
| POST   | `/exams/:id/unpublish`        | `ADMIN`                                                   | —                                                                                      | intended only | —                              |
| GET    | `/results/student/:studentId` | `ADMIN`, `TEACHER`, `STUDENT` (own), `PARENT` (own child) | —                                                                                      | intended only | —                              |

### Fees

| Method | Path                               | Roles                                 | 403 — code + condition                                                                | Enforced?     | Query params                                   |
| ------ | ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------- |
| GET    | `/fees/invoices`                   | `ADMIN`                               | —                                                                                     | intended only | `search`, `status`, `classId`, `page`, `limit` |
| GET    | `/fees/pending`                    | `ADMIN`                               | —                                                                                     | intended only | `classId`, `page`, `limit`                     |
| GET    | `/fees/summary`                    | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| GET    | `/fees/dashboard`                  | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| GET    | `/fees/structures`                 | `ADMIN`                               | —                                                                                     | intended only | `classId`                                      |
| POST   | `/fees/heads`                      | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| PATCH  | `/fees/heads/:id`                  | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| DELETE | `/fees/heads/:id`                  | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| GET    | `/fees/collect/summary`            | `ADMIN`                               | —                                                                                     | intended only | `classId`, `status`                            |
| GET    | `/fees/collect/students`           | `ADMIN`                               | —                                                                                     | intended only | `classId`, `status`, `page`, `limit`           |
| GET    | `/fees/collect/student/:studentId` | `ADMIN`, `PARENT` (own child)         | —                                                                                     | intended only | —                                              |
| POST   | `/fees/invoices`                   | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| POST   | `/fees/payments/manual`            | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| GET    | `/fees/me`                         | `STUDENT` (own), `PARENT` (own child) | `FEE_FORBIDDEN` — the caller is staff; `PARENT_FORBIDDEN` — `studentId` is not theirs | standard      | `studentId`                                    |
| POST   | `/fees/me/payments`                | `STUDENT` (own), `PARENT` (own child) | `FEE_FORBIDDEN` — the caller is staff, or the invoice is not on the caller's account  | standard      | —                                              |
| GET    | `/fees/payments/:id/receipt`       | `ADMIN`, `PARENT` (own child)         | —                                                                                     | intended only | —                                              |
| GET    | `/fees/reports/day-book`           | `ADMIN`                               | —                                                                                     | intended only | `date`                                         |
| GET    | `/fees/reports/class`              | `ADMIN`                               | —                                                                                     | intended only | `classId`                                      |
| GET    | `/fees/reports/defaulters`         | `ADMIN`                               | —                                                                                     | intended only | `classId`                                      |
| GET    | `/fees/reports/student-ledger`     | `ADMIN`, `PARENT` (own child)         | —                                                                                     | intended only | `studentId`                                    |
| GET    | `/fees/concessions`                | `ADMIN`                               | —                                                                                     | intended only | `search`, `status`                             |
| POST   | `/fees/concessions`                | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| PATCH  | `/fees/concessions/:id`            | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| DELETE | `/fees/concessions/:id`            | `ADMIN`                               | —                                                                                     | intended only | —                                              |
| GET    | `/fees/history/:studentId`         | `ADMIN`, `PARENT` (own child)         | —                                                                                     | intended only | —                                              |

### Notices

| Method | Path           | Roles          | 403 — code + condition | Enforced?     | Query params              |
| ------ | -------------- | -------------- | ---------------------- | ------------- | ------------------------- |
| GET    | `/notices`     | all four roles | —                      | standard      | `search`, `page`, `limit` |
| POST   | `/notices`     | `ADMIN`        | —                      | intended only | —                         |
| PATCH  | `/notices/:id` | `ADMIN`        | —                      | intended only | —                         |
| DELETE | `/notices/:id` | `ADMIN`        | —                      | intended only | —                         |

### Chat

| Method | Path                             | Roles             | 403 — code + condition                                            | Enforced? | Query params |
| ------ | -------------------------------- | ----------------- | ----------------------------------------------------------------- | --------- | ------------ |
| GET    | `/chat/conversations`            | any authenticated | —                                                                 | standard  | —            |
| GET    | `/chat/:conversationId/messages` | participant       | `CHAT_NOT_A_PARTICIPANT` — the caller is not in that conversation | standard  | —            |

### Permissions

| Method | Path                 | Roles   | 403 — code + condition | Enforced?     | Query params |
| ------ | -------------------- | ------- | ---------------------- | ------------- | ------------ |
| GET    | `/permissions`       | `ADMIN` | —                      | intended only | —            |
| GET    | `/permissions/staff` | `ADMIN` | —                      | intended only | —            |

### AI

| Method | Path                | Roles             | 403 — code + condition | Enforced? | Query params |
| ------ | ------------------- | ----------------- | ---------------------- | --------- | ------------ |
| GET    | `/ai/context`       | any authenticated | —                      | standard  | —            |
| GET    | `/ai/conversations` | any authenticated | —                      | standard  | `feature`    |

### Reports

| Method | Path                           | Roles              | 403 — code + condition | Enforced?     | Query params               |
| ------ | ------------------------------ | ------------------ | ---------------------- | ------------- | -------------------------- |
| GET    | `/reports/overview`            | `ADMIN`, `TEACHER` | —                      | intended only | —                          |
| GET    | `/reports/attendance`          | `ADMIN`, `TEACHER` | —                      | intended only | `month`, `year`, `classId` |
| GET    | `/reports/exam-results/papers` | `ADMIN`, `TEACHER` | —                      | intended only | —                          |
| GET    | `/reports/exam-results`        | `ADMIN`, `TEACHER` | —                      | intended only | `paperId`                  |
| GET    | `/reports/finance`             | `ADMIN`, `TEACHER` | —                      | intended only | —                          |

### Progress

| Method | Path           | Roles           | 403 — code + condition                                     | Enforced? | Query params |
| ------ | -------------- | --------------- | ---------------------------------------------------------- | --------- | ------------ |
| GET    | `/progress/me` | `STUDENT` (own) | `PROGRESS_FORBIDDEN` — the caller is not a student account | standard  | —            |

### Dashboard

| Method | Path                 | Roles                | 403 — code + condition                                                                               | Enforced?     | Query params |
| ------ | -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- | ------------- | ------------ |
| GET    | `/dashboard/admin`   | `ADMIN`              | —                                                                                                    | intended only | —            |
| GET    | `/dashboard/student` | `STUDENT` (own)      | `DASHBOARD_FORBIDDEN` — the caller is not a student account                                          | standard      | —            |
| GET    | `/dashboard/parent`  | `PARENT` (own child) | `DASHBOARD_FORBIDDEN` — the caller is not a guardian; `PARENT_FORBIDDEN` — `studentId` is not theirs | standard      | `studentId`  |

### Route-access totals

- **Total routes: 109.**
- **Public (no token): 9** — `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-invite`, `/schools/register`, `/schools/verify-otp`, `/schools/resend-otp`.
- **Token required: 100.** Of these, **10 are role-gated** and **90 are token-only**.
- **Role-gated (the mock refuses the wrong role): 10** — `GET /dashboard/student`, `GET /dashboard/parent`, `GET /attendance/me`, `GET /attendance/monthly`, `GET /attendance`, `POST /attendance`, `GET /fees/me`, `POST /fees/me/payments`, `GET /exams/me`, `GET /progress/me`.
- **`intended only`: 79** — 78 token-only routes that the contract scopes to a strict subset of roles, plus `/auth/logout` (which the contract gates on a session but the mock serves publicly).
- **`standard`: 30** — 8 public routes, the 10 role-gated routes, and 12 routes whose contract scope is all four roles, `authenticated` or `participant` (where the token or participation check is the whole of the documented rule).

> Note — The contract says every route carries `JwtAuthGuard` + `RolesGuard` with `@Roles(...)` per
> route (`PRD.md` §4 introduction and §4.2), which implies a role decorator on every route. The mock
> does not do this: it checks the token globally against `PUBLIC_PATHS` and then role-gates only the
> 10 routes above. This file records that gap rather than the aspiration — `intended only` marks a
> route the mock lets any valid token reach. The client's routing (`RoleGuard`) narrows by role in
> the browser, but that is a UI convenience, not a server check, and it does not protect the API.

## 4. Error code catalogue

Every `SCREAMING_SNAKE` code the mock can return, with its HTTP status and the condition that raises
it, grouped by domain. Codes carried in the error envelope
`{ success: false, error: { code, message, details? } }`; `details` is a field-message array on the
400 validation codes only.

### Auth and session

| Code                       | Status | Raised when                                                                                                      |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `AUTH_INVALID_CREDENTIALS` | 401    | `POST /auth/login` with an unknown email or a wrong password.                                                    |
| `AUTH_NOT_VERIFIED`        | 403    | `POST /auth/login` for an account whose invite has not been confirmed.                                           |
| `AUTH_SESSION_EXPIRED`     | 401    | `POST /auth/refresh` with no live session (no refresh-cookie shim value).                                        |
| `AUTH_UNAUTHENTICATED`     | 401    | `GET /auth/me` with no matching user; also the global check for a missing/invalid token on any non-public route. |
| `AUTH_RESET_TOKEN_INVALID` | 400    | `POST /auth/reset-password` with a token equal to `expired`.                                                     |
| `AUTH_OTP_INVALID`         | 400    | `POST /schools/verify-otp` with a code other than the demo OTP.                                                  |
| `INVITE_NOT_FOUND`         | 404    | `POST /auth/verify-invite` for an email with no account.                                                         |
| `INVITE_INVALID`           | 400    | `POST /auth/verify-invite` with a code other than the demo OTP.                                                  |
| `VALIDATION_ERROR`         | 400    | `POST /auth/reset-password` where the new password is under 8 characters.                                        |

### School and settings

| Code                 | Status | Raised when                                                          |
| -------------------- | ------ | -------------------------------------------------------------------- |
| `SCHOOL_EMAIL_TAKEN` | 409    | `POST /schools/register` with an email already registered.           |
| `SCHOOL_INVALID`     | 400    | `PATCH /schools/current` with a blank name.                          |
| `SETTINGS_INVALID`   | 400    | `PATCH /schools/current/settings` with an unsupported/invalid field. |

### Users and permissions

| Code                 | Status | Raised when                                                       |
| -------------------- | ------ | ----------------------------------------------------------------- |
| `USER_NOT_FOUND`     | 404    | `GET`/`PUT /users/:userId/permissions` for an unknown user.       |
| `PERMISSION_INVALID` | 400    | `PUT /users/:userId/permissions` with a key not in the catalogue. |

### Teachers

| Code                  | Status | Raised when                                                           |
| --------------------- | ------ | --------------------------------------------------------------------- |
| `TEACHER_INVALID`     | 400    | teacher create/edit with a missing name/subject or a malformed email. |
| `TEACHER_EMAIL_TAKEN` | 409    | teacher create/edit where the email already has an account.           |
| `TEACHER_NOT_FOUND`   | 404    | teacher read: the teacher id is unknown.                              |

### Students

| Code                  | Status | Raised when                                                                         |
| --------------------- | ------ | ----------------------------------------------------------------------------------- |
| `STUDENT_INVALID`     | 400    | student create/edit fails a field check (names, email, class, roll, profile block). |
| `STUDENT_EMAIL_TAKEN` | 409    | student create/edit where the email already has an account.                         |
| `STUDENT_ROLL_TAKEN`  | 409    | student create/edit where the roll number is already used in that class.            |
| `STUDENT_NOT_FOUND`   | 404    | a student id is unknown (profile, documents, attendance, results, collect, fees).   |

### Subjects

| Code                 | Status | Raised when                                                                        |
| -------------------- | ------ | ---------------------------------------------------------------------------------- |
| `SUBJECT_INVALID`    | 400    | a subject/assignment body fails a check (class, subject ids, name, 2–6 char code). |
| `SUBJECT_NOT_FOUND`  | 404    | the subject, class or assignment id is unknown.                                    |
| `SUBJECT_NAME_TAKEN` | 409    | create/edit a subject whose name already exists.                                   |
| `SUBJECT_CODE_TAKEN` | 409    | create/edit a subject whose code is already in use.                                |
| `SUBJECT_IN_USE`     | 409    | delete a subject still referenced by a lesson, paper, mark, homework or material.  |

### Attendance

| Code                   | Status | Raised when                                                                                                            |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| `ATTENDANCE_FORBIDDEN` | 403    | staff reads `/attendance/me`; a student/guardian reads the class register; `studentId` is not on the caller's account. |
| `ATTENDANCE_INVALID`   | 400    | a register write/read with a bad class, date, status or empty/mismatched records.                                      |
| `ATTENDANCE_NOT_FOUND` | 404    | `/attendance/me` resolves to a student that does not exist.                                                            |

### Homework

| Code                 | Status | Raised when                                                                            |
| -------------------- | ------ | -------------------------------------------------------------------------------------- |
| `HOMEWORK_INVALID`   | 400    | a homework body fails a check (class, subject-not-taught, title, due date, max marks). |
| `HOMEWORK_NOT_FOUND` | 404    | the assignment id is unknown (edit/delete).                                            |

### Materials

| Code                 | Status | Raised when                                                                             |
| -------------------- | ------ | --------------------------------------------------------------------------------------- |
| `MATERIAL_INVALID`   | 400    | an upload fails a check (class, subject-not-taught, title, type, file missing/invalid). |
| `MATERIAL_NOT_FOUND` | 404    | the material id is unknown (read/delete).                                               |

### Timetable

| Code                         | Status | Raised when                                                                                   |
| ---------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `TIMETABLE_FORBIDDEN`        | 403    | `/timetables/me` where `studentId` is not the caller/their child.                             |
| `TIMETABLE_INVALID`          | 400    | a slot/period body fails a check (day, subject-not-taught, teacher, times, last-row removal). |
| `TIMETABLE_NOT_FOUND`        | 404    | the class has no timetable (or the class is unknown).                                         |
| `TIMETABLE_PERIOD_NOT_FOUND` | 404    | the `orderIndex`/period addressed does not exist.                                             |

### Exams and results

| Code             | Status | Raised when                                                                            |
| ---------------- | ------ | -------------------------------------------------------------------------------------- |
| `EXAM_FORBIDDEN` | 403    | `/exams/me` where the caller is a staff account.                                       |
| `EXAM_INVALID`   | 400    | an exam body fails a check (class, subject-not-taught, title, dates, marks, duration). |
| `EXAM_NOT_FOUND` | 404    | the exam id is unknown on any exam route.                                              |
| `EXAM_PUBLISHED` | 409    | edit/marks on an exam that is already published.                                       |

### Fees

| Code                       | Status | Raised when                                                                                  |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `FEE_FORBIDDEN`            | 403    | `/fees/me*` where the caller is staff, or the invoice is not on the caller's account.        |
| `FEE_VALIDATION`           | 400    | a fee body fails a check (unknown student, a head from another class, a field out of range). |
| `FEE_HEAD_EXISTS`          | 409    | `POST /fees/heads` where the structure already has a head with that title.                   |
| `FEE_HEAD_NOT_FOUND`       | 404    | the fee-head id is unknown (edit/delete/create invoice).                                     |
| `FEE_INVOICE_EXISTS`       | 409    | `POST /fees/invoices` where that head is already raised for that student.                    |
| `FEE_INVOICE_NOT_FOUND`    | 404    | the invoice id is unknown (manual payment, self-service payment).                            |
| `FEE_CONCESSION_NOT_FOUND` | 404    | the concession id is unknown (edit/delete).                                                  |
| `FEE_PAYMENT_NOT_FOUND`    | 404    | `GET /fees/payments/:id/receipt` for an unknown payment.                                     |

### Notices

| Code               | Status | Raised when                                                 |
| ------------------ | ------ | ----------------------------------------------------------- |
| `NOTICE_INVALID`   | 400    | a notice body fails a check (title, description, priority). |
| `NOTICE_NOT_FOUND` | 404    | the notice id is unknown on edit/delete.                    |

### Chat

| Code                          | Status | Raised when                                                                 |
| ----------------------------- | ------ | --------------------------------------------------------------------------- |
| `CHAT_NOT_A_PARTICIPANT`      | 403    | `GET /chat/:conversationId/messages` where the caller is not a participant. |
| `CHAT_CONVERSATION_NOT_FOUND` | 404    | the conversation id is unknown.                                             |

### Reports and progress

| Code                     | Status | Raised when                                                   |
| ------------------------ | ------ | ------------------------------------------------------------- |
| `REPORT_PAPER_NOT_FOUND` | 404    | `GET /reports/exam-results` for an unknown `paperId`.         |
| `PROGRESS_FORBIDDEN`     | 403    | `GET /progress/me` where the caller is not a student account. |
| `PROGRESS_NOT_FOUND`     | 404    | `GET /progress/me` resolves to a student that does not exist. |

### Dashboard

| Code                  | Status | Raised when                                                                   |
| --------------------- | ------ | ----------------------------------------------------------------------------- |
| `DASHBOARD_FORBIDDEN` | 403    | `/dashboard/student` or `/dashboard/parent` where the caller's role is wrong. |
| `DASHBOARD_NOT_FOUND` | 404    | the student is unknown, or a guardian account has no children.                |

### Shared ownership and platform

| Code               | Status | Raised when                                                                                                           |
| ------------------ | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `PARENT_FORBIDDEN` | 403    | a `?studentId=`/`:studentId` names a child that is not on the caller's account (dashboard/parent, fees/me, exams/me). |
| `NOT_FOUND`        | 404    | no route matches the method and path (`No mock route for …`).                                                         |

## 5. Client-side guards

The browser guards wrap the route tree (`frontend/src/routes/`). They decide on session status and
role only; the decision logic is factored into `guardDecision.ts`. Redirect targets come from
`frontend/src/routes/paths.ts` (`login` = `/login`, `dashboard` = `/`).

| Guard             | Applies to       | Behaviour                                                                                                                                                                                                               |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProtectedRoute`  | the private tree | While `status === 'loading'` renders the `RouteFallback` spinner (no redirect on a refresh). When anonymous, redirects to `/login`, carrying the intended location in `state.from`. Otherwise renders the child routes. |
| `PublicOnlyRoute` | the auth screens | While loading renders the spinner. When authenticated, redirects to `/` (dashboard). Otherwise renders the child routes.                                                                                                |
| `RoleGuard`       | route groups     | Reads the current user's role. A `null` role redirects to `/login`; a role not in `allow` redirects to `/` (dashboard). Otherwise renders the child routes.                                                             |

`useSessionStatus()`/`useCurrentUser()` come from the auth store (`frontend/src/store/auth.ts`); the
access token lives in memory only and the session is restored by a refresh call, so `status` starts
as `'loading'`.

`RoleGuard` groups in `privateRoutes.tsx`:

| `allow`                          | Routes behind it                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `['ADMIN', 'TEACHER']`           | `/students`, `/reports`                                                                                                                         |
| `['STUDENT']`                    | `/my-reports`, `/progress`                                                                                                                      |
| `['ADMIN']`                      | `/teachers`, `/permissions`, `/subjects`, `/settings`                                                                                           |
| `['ADMIN', 'TEACHER', 'PARENT']` | `/students/:id`                                                                                                                                 |
| `['ADMIN', 'PARENT']`            | `/fees`, `/fees/collect/:studentId`                                                                                                             |
| (no guard)                       | `/` (dashboard), `/attendance`, `/homework`, `/study-materials`, `/timetable`, `/notices`, `/chat`, `/exams`, `/ai`, and the `*` not-found page |

## 6. Ownership and pairing rules

With only 10 role-gated routes, the checks that carry most of the access today are ownership and
pairing rules applied inside handlers. They are the real gates on personal data.

**The `?studentId=` self/child rule.** Personal reads resolve their subject from the session and
accept an optional `?studentId=` to pick one of a guardian's own children. A student may read only
their own record; a guardian may read only one of their own children (`parentStudents` links); any
other id is refused. The same rule appears on five routes, but the refusing code differs:

| Route                   | Builds the allowed set via                      | Off-account id refused with |
| ----------------------- | ----------------------------------------------- | --------------------------- |
| `GET /attendance/me`    | `attendanceStudentsFor` (own record / children) | `ATTENDANCE_FORBIDDEN`      |
| `GET /dashboard/parent` | `parentStudents` → the guardian's `children[]`  | `PARENT_FORBIDDEN`          |
| `GET /fees/me`          | `subjectOptionsFor` (own record / children)     | `PARENT_FORBIDDEN`          |
| `GET /exams/me`         | `subjectOptionsFor` (own record / children)     | `PARENT_FORBIDDEN`          |
| `GET /timetables/me`    | `parentStudents` → children, or own class       | `TIMETABLE_FORBIDDEN`       |

`POST /fees/me/payments` applies the same ownership rule to a body `invoiceId`: an invoice not on
the caller's account is refused with `FEE_FORBIDDEN`. Note that `GET /students/:id` — which the
client opens to parents — has **no** ownership check at all, so any valid token can read any
student's profile.

**The `classId` + `subjectId` must-be-taught-together rule.** Any route that takes a class and a
subject together validates the pair against `class_subjects` (`classSubjectFor`) and refuses a
subject the class does not run, with a 400 on the offending field. It applies to:

| Route                                                    | Code on a mismatch  |
| -------------------------------------------------------- | ------------------- |
| `POST /homework`, `PATCH /homework/:id`                  | `HOMEWORK_INVALID`  |
| `POST /materials`                                        | `MATERIAL_INVALID`  |
| `PATCH /timetables/class/:classId/slots`                 | `TIMETABLE_INVALID` |
| `POST /exams` (each TEST/EXAM paper), `PATCH /exams/:id` | `EXAM_INVALID`      |

**The fee-head-must-belong-to-the-student's-structure rule.** A student's invoices are drawn from
the structure their class runs: `POST /fees/invoices` resolves `structureForClass(student.classId)`
and refuses a `feeHeadId` whose `feeStructureId` is a different structure with
`400 FEE_VALIDATION` on `feeHeadId`. `POST /fees/concessions` likewise checks that a supplied
`feeHeadId` exists, refusing an unknown one with `400 FEE_VALIDATION`.

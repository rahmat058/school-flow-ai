# Backend PRD — School Management System (NestJS + PostgreSQL/Supabase)

## 1. Overview

### 1.1 Purpose

Build the complete backend for a multi-role School Management System using **NestJS and Supabase (PostgreSQL)**, serving a React.js frontend. The backend powers Admin, Teacher, Student, and Parent dashboards with attendance, fees, homework, exams, AI assistance, real-time chat, reports, and role-based security.

> Feature scope is aligned with the complete school-management feature set: school registration with OTP, dashboard analytics, student/teacher/parent management, class & subject management, school settings, attendance (daily/bulk/monthly/analytics), fee management (structures, collection, pending, history, reports, concessions), homework with submissions, timetables, tests & exams with report cards, study materials (PDFs, notes, worksheets, previous-year papers), real-time chat between permitted role pairs, notices & events, a seven-feature AI assistant, reports with CSV export, JWT/bcrypt security, and automated emails.

### 1.2 Tech Stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Runtime      | Node.js + TypeScript                                                    |
| Framework    | NestJS (modular architecture)                                           |
| Database     | PostgreSQL via Supabase                                                 |
| Data access  | Supabase (`@supabase/supabase-js`), service-role key on the server only |
| Real-Time    | Socket.io (NestJS WebSocket Gateways)                                   |
| Auth         | JWT (Passport.js) + bcrypt                                              |
| File Storage | Cloudinary (or Supabase Storage)                                        |
| Email        | Resend (transactional email API) + React Email templates                |
| Payments     | Stripe (international) + SSLCommerz (Bangladesh)                        |
| AI           | LLM API (e.g., OpenAI/Gemini)                                           |
| Validation   | class-validator + class-transformer (DTOs)                              |
| Queue/Jobs   | BullMQ (Redis) or @nestjs/schedule                                      |
| Deployment   | Render (API), Supabase (DB), Cloudinary                                 |

### 1.3 Architecture

- **NestJS modular structure**: one module per domain (`auth/`, `schools/`, `users/`, `attendance/`, `fees/`, `homework/`, `timetables/`, `exams/`, `chat/`, `notices/`, `ai/`, `materials/`, `reports/`), each with `*.module.ts`, `*.controller.ts`, `*.service.ts`, and `dto/`
- Global Supabase client (single injectable service) in a shared `database/` module — all DB access goes through it
- RESTful APIs versioned via `app.setGlobalPrefix('api/v1')` or NestJS URI versioning
- Multi-tenant: every table carries a `schoolId` foreign key; a global tenant guard scopes all queries
- Socket.io via NestJS `@WebSocketGateway()` on the same HTTP server
- Role-Based Access Control (RBAC): `ADMIN | TEACHER | STUDENT | PARENT` as a Postgres enum, enforced with `@Roles()` decorator + `RolesGuard`

### 1.4 Non-Functional Requirements

- Response time < 300ms for standard CRUD endpoints
- Paginated list endpoints (default `take=20`, cursor or page-based)
- DTO validation on all request bodies via global `ValidationPipe` (`whitelist: true`, `transform: true`)
- Global exception filter with consistent error shape
- Rate limiting on auth endpoints (OTP, login) via `@nestjs/throttler`
- Helmet, CORS whitelist, parameterized queries via the Supabase client (SQL-injection safe by default)

---

## 2. Roles & Access Matrix

| Module                           | Admin | Teacher              | Student             | Parent       |
| -------------------------------- | ----- | -------------------- | ------------------- | ------------ |
| School registration/settings     | ✅    | ❌                   | ❌                  | ❌           |
| User management (CRUD)           | ✅    | ❌                   | ❌                  | ❌           |
| Class/Subject management         | ✅    | ❌                   | ❌                  | ❌           |
| Attendance (mark)                | ✅    | ✅                   | ❌                  | ❌           |
| Attendance (view)                | ✅    | ✅                   | own                 | child's      |
| Homework (create)                | ✅    | ✅                   | ❌                  | ❌           |
| Homework (submit/view)           | ✅    | ✅                   | ✅                  | child's      |
| Fees (structure/collect/reports) | ✅    | ❌                   | pay own             | pay child's  |
| Exams (create/publish)           | ✅    | ✅                   | view                | view child's |
| Timetable                        | ✅    | view own             | view own            | view child's |
| Study material (upload)          | ✅    | ✅                   | download            | view         |
| Notices (publish)                | ✅    | ❌                   | view                | view         |
| Chat                             | ✅    | ✅                   | ✅                  | ✅           |
| Roles & permissions (manage)     | ✅    | ❌                   | ❌                  | ❌           |
| AI Assistant                     | all 7 | report-comment, quiz | homework-help, quiz | ❌           |
| Reports & exports                | ✅    | limited              | ❌                  | ❌           |

---

## 3. Data Models (PostgreSQL — Supabase)

All tables live in the Supabase project (`supabase/` migrations are the source of truth). All models include `id` (UUID), `schoolId` (FK → School), `createdAt`, `updatedAt` unless noted. Key enums: `Role`, `AttendanceStatus`, `PaymentStatus`, `ExamType`, `MaterialType`.

- **School** — name, address, contact, logo, subscriptionStatus, settings (JSONB: academic + notifications + security), slug
- **User** — email (unique), passwordHash, role (enum), schoolId, isVerified
- **Teacher / Student / Parent** — profile tables with 1:1 FK to User
- **ParentStudent** — join table (many-to-many parent ↔ child)
- **Class** — grade, section, classTeacherId (FK → Teacher)
- **Subject** — name, code, classId, teacherId
- **Attendance** — date, classId, studentId, status (`PRESENT | ABSENT | LEAVE | LATE`); unique constraint on (classId, studentId, date)
- **FeeStructure** — classId, heads (JSONB array or FeeHead child table: name, amount, frequency)
- **FeeInvoice** — studentId, amount, dueDate, status (`PENDING | PAID | PARTIAL | OVERDUE`), receiptNo
- **FeePayment** — invoiceId, studentId, amount, method, provider (`STRIPE | SSLCOMMERZ`), providerOrderId, status (`PENDING | PAID | FAILED`), paidAt
- **Concession** — studentId, type, percentage/amount, status, approvedById
- **Homework** — classId, subjectId, teacherId, title, description, dueDate, attachments (string[])
- **HomeworkSubmission** — homeworkId, studentId, files (string[]), submittedAt, isLate, grade, remarks
- **Exam** — classId, name, kind (`TEST | EXAM`), type (`UNIT | MID | FINAL | ANNUAL`), startDate, endDate, description
- **ExamSubject** — examId, subjectId, date, maxMarks, durationMin
- **Result** — examId, studentId, subjectId, obtainedMarks, isAbsent, remarks
- **ReportCard** — examId, studentId, totalMarks, percentage, grade, rank, aiComment
- **Timetable** — classId, day (`MON`–`SUN`), periods → **Period** child table (startTime, endTime, subjectId, teacherId, isBreak)
- **StudyMaterial** — classId, subjectId, title, type (`PDF | NOTES | WORKSHEET | PAPER`), fileUrl
- **Notice** — title, body, priority (`HIGH | MEDIUM | LOW`), audience (enum[] or JSONB), authorName, publishedById, publishedAt
- **Event** — title, date, description, audience
- **Conversation** — participants → **ConversationParticipant** join table (per-caller read state in `lastReadAt`); lastMessageAt
- **Message** — conversationId, senderId, body, readAt
- **Permission** — key (`resource.action`), group, label, sortOrder — the platform-wide catalogue
- **UserPermission** — userId, permissionId, grantedById — one account's effective grant
- **Otp** — email, codeHash, expiresAt, attempts, purpose (`REGISTER | RESET_PASSWORD | INVITE`)
- **AiConversation** — userId, feature, messages (JSONB)

**Indexes**: `(schoolId)` on all tenant tables; composite indexes on Attendance(classId, date), FeeInvoice(studentId, status), Message(conversationId, createdAt), UserPermission(userId, permissionId). `Permission` is the one table with no tenant column — its unique `key` is the index.

---

## 4. Feature Modules

Each module lists its endpoints as a **checklist — build one endpoint at a time**, controller route first, then service, DTO and guard. Build a module's list top to bottom: creation and reads unblock the frontend, aggregates and exports come last. `(public)` marks routes reachable without a session; every other route needs `JwtAuthGuard` + `RolesGuard` and the tenant scope in parentheses. Tick the item here, then its phase line in `Phases.md`. Tables each module touches are specified in `docs/backend/Database.md`.

### 4.1 School Registration & OTP Verification (`SchoolsModule`)

**Tables:** `schools`, `users`, `otps` · Database.md §3

**Endpoints**

- [ ] `POST /api/v1/schools/register` — create school + admin user, trigger OTP `(public)`
- [ ] `POST /api/v1/schools/verify-otp` — validate OTP, activate account `(public)`
- [ ] `POST /api/v1/schools/resend-otp` — resend within the 60s cooldown `(public)`
- [ ] `GET /api/v1/schools/current` — the caller's own school: profile columns + the whole `settings` document `(admin)` — the frontend already calls this
- [ ] `PATCH /api/v1/schools/current` — update the school profile (`name`, `contactEmail`, `contactPhone`, `address`, `logoUrl`); a blank contact field clears to `null` and the slug is **not** regenerated `(admin)`
- [ ] `PATCH /api/v1/schools/current/settings` — merge a partial patch into `schools.settings`; each tab of the Settings screen sends only its own slice `(admin)`
- [ ] `POST /api/v1/schools/current/backup` — request a manual backup of the school's data; `201` with the job record `(admin)`

**Behavior**

- 6-digit OTP (bcrypt-hashed in `Otp` table), 10-minute expiry, max 5 attempts, resend cooldown 60s
- Email verification via Resend before admin login is allowed
- Unique school slug auto-generated at registration; a rename leaves it alone so stored links keep working
- Registration runs in a database transaction (school + admin user + OTP)
- **Settings are addressable by tab, not as one document.** The Settings screen's four tabs map onto one `schools.settings` JSONB: School Profile writes the school's own **columns** (`PATCH /schools/current`), while Academic writes `academicYear`/`gradingScale`/`termStructure`/`passPercentage`, Notifications writes the `notifications` object and Security writes the `security` object — all through `PATCH …/settings`, which **merges only the keys sent** so the tabs cannot overwrite one another
- Settings unions are contract-level, not DB enums (they live in JSONB): `gradingScale` ∈ `PERCENTAGE | LETTER | GPA`, `termStructure` ∈ `SEMESTER | TRIMESTER | ANNUAL`, `passPercentage` an integer `0–100`, `security.sessionTimeoutMinutes` `5–240`, `security.maxLoginAttempts` `1–10` — anything else is `400 SETTINGS_INVALID` with the offending fields in `details`
- **No settings route carries a school id** — the screen edits the caller's own school, so the tenant comes from the session, not the path. The earlier `GET`/`PATCH /schools/:id/settings` pair is superseded by the `current`-scoped routes
- `POST …/backup` answers `201` with `{ id, createdAt, sizeBytes, status }`; the demo returns `READY` at once, while a real deployment enqueues a BullMQ job and returns `PENDING`, so the client reads `status` rather than assuming the snapshot exists

### 4.2 Authentication & RBAC (`AuthModule`)

**Tables:** `users`, `refresh_tokens`, `permissions`, `user_permissions` · Database.md §3

**Endpoints**

- [ ] `POST /api/v1/auth/login` — JWT (access 15m + refresh 7d) `(public)`
- [ ] `POST /api/v1/auth/refresh` — rotate the refresh token `(public)`
- [ ] `POST /api/v1/auth/logout` — revoke the stored refresh token `(authenticated)`
- [ ] `POST /api/v1/auth/forgot-password` — email the reset token `(public)`
- [ ] `POST /api/v1/auth/reset-password` — set a new password from the reset token `(public)`
- [ ] `POST /api/v1/auth/verify-invite` — confirm an invite with the emailed one-time code (an OTP of purpose `INVITE`), flipping the login to verified. Confirming twice succeeds rather than erroring, because an emailed link can be opened twice `(public)`
- [ ] `GET /api/v1/auth/me` — current user + school + role `(authenticated)`
- [ ] `GET /api/v1/permissions` — the assignable catalogue, grouped and ordered for the editor `(admin)`
- [ ] `GET /api/v1/permissions/staff` — the staff picker: every active teacher with their grant count `(admin)`
- [ ] `GET /api/v1/users/:userId/permissions` — one account's granted keys `(admin)`
- [ ] `PUT /api/v1/users/:userId/permissions` — replace that account's grant set (the body carries the whole set, so a role default can be turned off) `(admin)`

**Behavior**

- Passport `JwtStrategy` + `JwtAuthGuard` (global); `RolesGuard` + `@Roles(Role.ADMIN)` decorator per route
- Fine-grained check runs after the role check: `@RequirePermission('students.edit')` + `PermissionsGuard`
  against the account's granted `user_permissions` keys
- `permissions` is **platform-wide** (no `school_id`); `user_permissions` holds each account's **effective** set
  and carries the tenant. A new account is seeded from the §2 matrix at creation, and the `PUT` replaces the set
  afterwards — which is what lets an admin turn a role default off
- bcrypt hashing (12 rounds)
- Refresh token rotation; hashed refresh tokens stored server-side
- Teachers/students/parents receive auto-generated credentials via email on creation

### 4.3 User Management (`UsersModule` — Admin only)

**Tables:** `teachers`, `students`, `parents`, `parent_students` · Database.md §3

**Endpoints** — build `/teachers` end to end first, then repeat the same five routes for `/students` and `/parents`

- [ ] `POST /api/v1/teachers` — create; takes **full name**, **subject**, **email** and the **assigned classes**, plus optional phone, qualification and years of experience. The login is created **unverified** with a generated password emailed alongside a verification link — the same invite rule as an enrolment — and 409 `TEACHER_EMAIL_TAKEN` guards the login email `(admin)`
- [ ] `GET /api/v1/teachers` — search by name/subject/email; each row carries the login email and the classes the teacher is assigned to (from `teacher_classes`) `(admin)`
- [ ] `GET /api/v1/teachers/:id` `(admin)`
- [ ] `PATCH /api/v1/teachers/:id` — partial update of the same fields; `classIds` **replaces** the assignment set rather than merging, and an email change is re-checked for uniqueness `(admin)`
- [ ] `DELETE /api/v1/teachers/:id` — soft delete via `deletedAt` `(admin)`
- [ ] `POST /api/v1/students` — create + admission number; takes the **student's own email** (which becomes their login — the address the form collects, never a generated one; 409 `STUDENT_EMAIL_TAKEN` guards it), the **roll number** (next free in the class when omitted; 409 `STUDENT_ROLL_TAKEN` if already used) and the **guardian** block — name, email, phone, address — reusing an existing parent with that email rather than duplicating. Date of birth, gender and **blood group** are required on the profile. **Two logins are provisioned, both unverified**: the student's own email and the guardian's email, each emailed its invite with a verification link; the response carries the student's invite, never a password itself `(admin)`
- [ ] `GET /api/v1/students` — paginated; search name/roll/admission no./guardian; filter by class and fee standing; every row carries its class label, **roll number**, **attendance share**, **fee standing** and the **primary guardian's contact** (the admin roster and its profile panel read these straight off the list) `(admin)`
- [ ] `GET /api/v1/students/:id` — the profile: the roster row plus homeroom teacher, days present/absent and the current attendance streak `(admin, parent of child)`
- [ ] `GET /api/v1/students/:id/documents` — files held against the student; an empty list until uploads exist `(admin, teacher, parent of child)`
- [ ] `PATCH /api/v1/students/:id` — partial update of the same fields; a roll change is validated against the class the student ends up in, and an **email change is re-checked for uniqueness** (it moves that account's login) `(admin)`
- [ ] `DELETE /api/v1/students/:id` — soft delete `(admin)`
- [ ] `POST /api/v1/parents` — create + email credentials `(admin)`
- [ ] `GET /api/v1/parents` — paginated, search `(admin)`
- [ ] `GET /api/v1/parents/:id` `(admin)`
- [ ] `PATCH /api/v1/parents/:id` `(admin)`
- [ ] `DELETE /api/v1/parents/:id` — soft delete `(admin)`
- [ ] `POST /api/v1/students/bulk-import` — CSV, validated row-by-row, transaction per batch `(admin)`
- [ ] `GET /api/v1/parents/:id/students` — linked children `(admin, parent own)`
- [ ] `POST /api/v1/parents/:id/link-student` — link through `parent_students` `(admin)`
- [ ] `DELETE /api/v1/parents/:id/link-student/:studentId` — unlink `(admin)`

**Behavior**

- Auto-generated admission/employee numbers (per-school sequence)
- Enrolment invites: creating a student provisions **two** logins — the student's own email and the guardian's — each created immediately but left **unverified**, with a password and a verification link (`otp_purpose = INVITE`) sent to that address. The email the form collects **is** the login, so the password that arrives is the one the account holds; sign-in is refused with 403 `AUTH_NOT_VERIFIED` until the link is confirmed, so a mistyped address can never become a live account. A teacher or a parent created on its own follows the same rule.
- Credentials emailed on account creation
- Parent ↔ student linking via `ParentStudent` join table

### 4.4 Class & Subject Management (`ClassesModule`)

**Tables:** `classes`, `subjects`, `class_subjects` (+ `students.class_id`) · Database.md §4

**Endpoints**

- [ ] `POST /api/v1/classes` — grade/section `(admin)`
- [ ] `GET /api/v1/classes` — list with student counts `(admin)`
- [ ] `GET /api/v1/classes/:id` — class + roster `(admin, teacher)`
- [ ] `PATCH /api/v1/classes/:id` — including class-teacher assignment `(admin)`
- [ ] `DELETE /api/v1/classes/:id` `(admin)`
- [ ] `GET /api/v1/classes/:id/students` — roster `(admin, teacher)`
- [ ] `POST /api/v1/classes/:id/assign-students` — bulk roster move `(admin)`
- [ ] `POST /api/v1/subjects` — add a **catalogue** subject: `name`, `code` (2–6 alphanumerics, each unique per school **case-insensitively**) and an optional `description`; 400 on a malformed code, 409 `SUBJECT_CODE_TAKEN` / `SUBJECT_NAME_TAKEN`. The new subject is **taught in no class** — assignment is a separate call `(admin)`
- [ ] `GET /api/v1/subjects` — the catalogue; `?classId=` narrows it to what that class runs, `?teacherId=` to what that teacher teaches `(admin, teacher)`
- [ ] `GET /api/v1/subjects/overview` — the catalogue with each subject's **`classCount`** and **`classIds`** (the Subjects tab's row, and the read-only class list the edit form shows) `(admin)`
- [ ] `PATCH /api/v1/subjects/:id` — rename, recode or rewrite the description; both uniqueness checks re-run. It **never touches assignments**, so editing a subject cannot re-teach it by accident `(admin)`
- [ ] `DELETE /api/v1/subjects/:id` — removes the subject and its assignments; 409 `SUBJECT_IN_USE` while a lesson, exam paper, **mark**, homework or material still references it `(admin)`
- [ ] `GET /api/v1/subjects/assignments?classId=` — one class's assigned subjects, with the class label (the Single Assignment panel) `(admin)`
- [ ] `POST /api/v1/subjects/assignments` — add `subjectIds` to one class; pairs already assigned are left alone, so the call is idempotent `(admin)`
- [ ] `POST /api/v1/subjects/assignments/bulk` — add `subjectIds` to every `classIds` entry in one request, returning how many assignments were new `(admin)`
- [ ] `DELETE /api/v1/subjects/assignments/:classId/:subjectId` — remove one subject from one class `(admin)`
- [ ] `GET /api/v1/subjects/summary` — every class, every subject and the assignment matrix between them (the Summary tab) `(admin)`

**Behavior**

- **Subjects are a school-wide catalogue, not per-class rows.** A period, a homework, an exam paper, a result and a material all point at the same `subjects` row; _which classes run it_ is `class_subjects`. That is what lets a code read `MATH` school-wide rather than `MATH-5A`, and it is why deleting a subject cascades its assignments but is refused (409 `SUBJECT_IN_USE`) while a lesson, paper, mark, homework or material still uses it.
- The teacher belongs to the **assignment**, not the subject — the same subject is taught by different staff in each class. A timetable period's teacher and a homework's default author are both read from `class_subjects`.
- Every module that takes a `subjectId` alongside a `classId` validates the **pair** against `class_subjects` and refuses a subject the class does not run (400): homework, materials, timetable slots, class tests and exam papers alike.
- The **assignment endpoints are additive** — the grid offers the subjects the class does not yet run, and the button counts what is being added; removal is per subject. Bulk assignment inserts only the missing pairs and reports the count, so a repeated run is a no-op.
- **The subject form never assigns.** `POST /subjects` and `PATCH /subjects/:id` write the catalogue row only, and the edit form renders the subject's classes as a **read-only** list pointing at the Assign Subjects tab. Adding and removing therefore have exactly one home — the assignment endpoints — and there is no second, partial path by which a class starts or stops teaching a subject.

### 4.5 Attendance Management (`AttendanceModule`)

**Tables:** `attendance` · Database.md §5

**Endpoints**

- [ ] `POST /api/v1/attendance` — daily/bulk mark (array of records, batch upsert) `(admin, teacher)`
- [ ] `GET /api/v1/attendance?classId=&date=` — the daily register: the class roster with each student's stored status, so a register opens pre-filled `(admin, teacher)`
- [ ] `GET /api/v1/attendance/monthly?classId=&month=` — one class's month: the month's totals (present/absent/late/leave/rate), one row per register day with that day's counts, and the months on record for the picker; `month` is an ISO key (`2026-08`) and defaults to the newest on record `(admin, teacher)`
- [ ] `GET /api/v1/attendance/me?month=&studentId=` — the caller's own month in the **same shape**, scoped to one student: each day carries **their** status, and the payload names the students the caller may switch between; `studentId` picks one of a guardian's children `(student own, parent of child)` — 403 `ATTENDANCE_FORBIDDEN` for a staff account or another family's child
- [ ] `GET /api/v1/attendance/student/:id` — the individual history the student profile's Attendance tab reads: lifetime totals plus a row per month `(admin, teacher, student own, parent of child)`
- [ ] `GET /api/v1/attendance/analytics?classId=` — trends and defaulters (<75%) `(admin, teacher)`
- [ ] `attendance:marked` socket event — notify the class's parents in real time

**Behavior**

- Unique (classId, studentId, date) constraint prevents duplicates
- Monthly %, streaks, and class analytics via SQL aggregations (Supabase RPC) / views
- Socket.io event `attendance:marked` notifies parents in real time
- **The two month reads share one shape** — `attendance/monthly` and `attendance/me` return the same totals, the same month picker and one row per register day; a `scope` field says whose month it is, and only a personal month carries a `status` per day (a class day has many students, so it carries that day's counts instead). `attendance/me` is **self-scoped** — a student reads only their own register, a guardian only their own children, and a staff account is refused because it has no personal register
- Each month payload returns the **months on record**, so the picker never offers an empty month; a requested month with no register returns empty `days` and zeroed totals — an empty month is empty, not an error
- **Absent includes leave** in every count here, as the roster, the profile's Attendance tab and `reports/attendance` already do, so `present + absent + late = total` holds; the personal day row still shows the student's true status (`LEAVE` included) and `rate` is `(present + late) ÷ total`

### 4.6 Fee Management (`FeesModule`)

**Tables:** `fee_structures`, `fee_heads`, `fee_invoices`, `fee_payments`, `concessions`, `receipt_sequences` · Database.md §8

**Endpoints** — every money-writing route runs in a transaction; read Behavior below before starting one

Structures & heads

- [ ] `POST /api/v1/fees/structures` — structure with its heads `(admin)`
- [ ] `GET /api/v1/fees/structures` — filter by class/academic year; each structure carries its heads, head count and sum of amounts, so the Fee structure tab renders the response directly `(admin)`
- [ ] `GET /api/v1/fees/structures/:id` `(admin)`
- [ ] `PATCH /api/v1/fees/structures/:id` `(admin)`
- [ ] `DELETE /api/v1/fees/structures/:id` `(admin)`
- [ ] `POST /api/v1/fees/heads` — add one head to a class's structure (title, amount, frequency, due date, academic year, description); 409 `FEE_HEAD_EXISTS` when that structure already has the title `(admin)`
- [ ] `PATCH /api/v1/fees/heads/:id` — partial update of the same fields; a head cannot move between structures `(admin)`
- [ ] `DELETE /api/v1/fees/heads/:id` — the head stops being chargeable; invoices already raised from it are kept `(admin)`

Collect

- [ ] `POST /api/v1/fees/invoices/generate` — bulk generation per class (transactional batch insert) `(admin)`
- [ ] `POST /api/v1/fees/invoices` — raise **one** invoice for a student from a fee head (the collect page's `+ Invoice`); 400 when the head belongs to another class, 409 `FEE_INVOICE_EXISTS` when that head is already invoiced for the student `(admin)`
- [ ] `GET /api/v1/fees/invoices` — paginated, filter by student/class/status `(admin)`
- [ ] `GET /api/v1/fees/invoices/:id` — invoice + its payments `(admin, parent of child)`
- [ ] `GET /api/v1/fees/collect/summary?classId=&status=` — the Collect fee tab's cards (total/paid/pending students, collected/pending totals) scoped by the active filters `(admin)`
- [ ] `GET /api/v1/fees/collect/students?classId=&status=` — paginated class-wise fee-status rows: what each student was billed, what came in, what is left and the resolved status `(admin)`
- [ ] `GET /api/v1/fees/collect/student/:studentId` — one student's collect payload: outstanding dues, the class structure's heads with their concession and net amount, and the payment history `(admin, parent of child)`
- [ ] `GET /api/v1/fees/pending?classId=` — outstanding balances `(admin)`
- [ ] `GET /api/v1/fees/history/:studentId` — payment history `(admin, parent of child)`
- [ ] `GET /api/v1/fees/summary` — collection totals for the fees dashboard's stat cards `(admin)`
- [ ] `GET /api/v1/fees/dashboard` — the fees dashboard's charts (twelve-month collected/pending trend, class-wise collection) plus the pending/defaulter list `(admin)`
- [ ] `GET /api/v1/fees/payments/:id/receipt` — the receipt payload for one payment `(admin, parent of child)`
- [ ] `POST /api/v1/fees/payments/create-order` — provider chosen by country/method: Stripe or SSLCommerz `(admin, student own, parent of child)`
- [ ] `POST /api/v1/fees/payments/verify` — signature/IPN verification, provider callback `(public)`
- [ ] `POST /api/v1/fees/payments/manual` — admin records a cash/cheque/DD payment against one invoice; the amount may not exceed the invoice's outstanding balance `(admin)`
- [ ] `POST /api/v1/webhooks/stripe` — Stripe events, signature verified `(public)`
- [ ] `POST /api/v1/webhooks/sslcommerz` — SSLCommerz IPN, verified `(public)`

Reports

- [ ] `GET /api/v1/fees/reports/day-book?date=` — the collections on one date (defaulting to the most recent collection day) with its transaction count and total `(admin)`
- [ ] `GET /api/v1/fees/reports/class?classId=&academicYear=` — per-student invoiced / paid / balance and a resolved `CLEAR`-or-status flag for one class `(admin)`
- [ ] `GET /api/v1/fees/reports/defaulters?classId=` — every demand with a balance left, most overdue first `(admin)`
- [ ] `GET /api/v1/fees/reports/student-ledger?studentId=` — one student's full ledger (one row per invoice) with invoiced / paid / balance totals `(admin, parent of child)`
- [ ] `GET /api/v1/fees/reports?from=&to=` — collection report + CSV export `(admin)`
- [ ] `GET /api/v1/fees/reports/export?type=&format=csv` — streaming CSV of any fee report above `(admin)`

Concessions

- [ ] `POST /api/v1/fees/concessions` — record a concession request `(admin)`
- [ ] `GET /api/v1/fees/concessions` — filter by status `(admin)`
- [ ] `GET /api/v1/fees/concessions/:id` `(admin)`
- [ ] `PATCH /api/v1/fees/concessions/:id` — the approval decision `(admin)`
- [ ] `DELETE /api/v1/fees/concessions/:id` `(admin)`

**Behavior**

- Atomic payment confirmation in a database transaction (payment + invoice status + receipt number sequence)
- Both webhook handlers verify the provider signature before touching an invoice (see §6)
- The **receipt is derived, not stored**: `GET /fees/payments/:id/receipt` joins the payment, its invoice, the student and the fee head
- The collect summary, the dashboard series and every report are **aggregates** computed server-side (SQL `group by` / RPC) — the frontend never rolls up a list it fetched
- AI fee-reminder text generator (see §4.12)

### 4.7 Homework & Assignment Module (`HomeworkModule`)

**Tables:** `homework`, `homework_submissions` · Database.md §6

**Endpoints**

- [ ] `POST /api/v1/homework` — teacher creates with attachments (Cloudinary): `title`, `description`, `dueDate`, optional `maxMarks` `(admin, teacher)`
- [ ] `GET /api/v1/homework?classId=&subjectId=&search=&status=` — list, scoped to the caller's role; each row carries its class / subject / author joins, the submission roll-up and a derived `status` `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/homework/:id` — detail + attachments `(admin, teacher, student, parent of child)`
- [ ] `PATCH /api/v1/homework/:id` `(admin, teacher)`
- [ ] `DELETE /api/v1/homework/:id` `(admin, teacher)`
- [ ] `POST /api/v1/homework/:id/submit` — student uploads a submission `(student)`
- [ ] `GET /api/v1/homework/:id/submissions` — teacher tracking, submitted/pending counts `(admin, teacher)`
- [ ] `PATCH /api/v1/homework/submissions/:id/grade` — grade + remarks `(admin, teacher)`

**Behavior**

- `isLate` computed against `dueDate` on submission
- Parent visibility into child's homework status
- A list row's `status` is derived, never stored: `OVERDUE` once `dueDate` has passed, `ACTIVE` otherwise
- `maxMarks` is an optional ceiling a graded submission is scored against — `null` means the task is unmarked
- `DELETE /homework/:id` is a soft delete (`deleted_at`), so submissions keep their parent

### 4.8 Timetable Management (`TimetablesModule`)

**Tables:** `timetables`, `periods` · Database.md §7

> Post-MVP for the **backend**: `Database.md` marks `timetables`/`periods` as `phase: none` and no phase claims them yet — build these after Phase 5. The frontend module ships against the mock API in the meantime.

**Endpoints**

- [ ] `POST /api/v1/timetables` — weekly timetable per class (nested create with periods) `(admin)`
- [ ] `GET /api/v1/timetables/class/:classId` — the class's week in one payload: `periods` (the rows), `days` (each carrying one slot per row) and the `stats` roll-ups `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/timetables/teacher/:teacherId` `(admin, teacher own)`
- [ ] `GET /api/v1/timetables/me` — the caller's **own** week, resolved by role, in the same grid shape as a class week: a teacher's own lessons (each cell naming the class they are in, blank where they are free), a student's class, or a guardian's child's class — a guardian may pass `?studentId=` for any of **their own** children, and the payload lists them so the view can switch `(authenticated)`
- [ ] `PATCH /api/v1/timetables/class/:classId/slots` — set one cell's `subjectId`/`teacherId`, or clear it by sending both null `(admin)`
- [ ] `POST /api/v1/timetables/class/:classId/periods` — append a period row to the class's week, written to every day in one transaction `(admin)`
- [ ] `DELETE /api/v1/timetables/class/:classId/periods/:orderIndex` — remove that row from every day and close the positions up `(admin)`
- [ ] `PUT /api/v1/timetables/:id` — **full replacement**: the body carries the whole period set, so this is the one route where `PUT` is correct `(admin)`
- [ ] `DELETE /api/v1/timetables/:id` `(admin)`

**Behavior**

- Conflict detection: teacher double-booking validation before save
- **Non-admins never pick a class**: `GET /timetables/me` resolves the caller's week server-side, so a teacher
  reads their own lessons on the same days × periods grid — the period rows are shared by every class, and each
  cell names the class they are in (blank where they are free) — while a student reads their own class's week
  read-only, and a guardian reads one of **their own** children's (any other `studentId` is refused with a 403).
  The class routes stay the admin's, and are what the class picker and the editor drive
- Break periods flagged via `isBreak` on Period
- The week's period rows are stored per day but **managed class-wide**: adding or removing one applies to every day of the class and is addressed by `orderIndex`, so the days cannot drift apart
- A row's label is the stored `label`, else `Period n` counted over teaching rows only — so the period after a break keeps its number
- Break rows carry no subject or teacher and are not editable in the grid; an unknown `orderIndex` is a 404 `TIMETABLE_PERIOD_NOT_FOUND`
- A week keeps at least one period row — removing the last one is refused rather than leaving an empty grid

### 4.9 Exams, Tests & Report Cards (`ExamsModule`)

**Tables:** `exams`, `exam_subjects`, `results`, `report_cards` · Database.md §9

**Endpoints**

- [ ] `POST /api/v1/exams` — schedule one class's assessment: `kind: TEST` takes a single `subjectId` with its date, total marks and duration; `kind: EXAM` takes a `subjects[]` set, each paper carrying its own date, marks and duration `(admin, teacher)`
- [ ] `GET /api/v1/exams` — filter by `kind` (TEST/EXAM), `classId`, `subjectId`, type and status `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/exams/me` — the **student's own** tests, exams and marks in one payload: the class's tests, exam windows and papers still ahead (each with its countdown), the published marks with their summary, and each subject's average; the tab counts and the four headline figures come off the same read `(student)` — 403 `EXAM_FORBIDDEN` for every other role
- [ ] `GET /api/v1/exams/:id` — exam with its subjects `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/exams/:id/results` — the marks sheet: every subject with its entry count, the class roster and every entry so far, so the grid loads all subjects at once `(admin, teacher)`
- [ ] `PATCH /api/v1/exams/:id` — edit; the body replaces the subject set whole, and a published exam is refused with 409 `EXAM_PUBLISHED` `(admin, teacher)`
- [ ] `DELETE /api/v1/exams/:id` — removes the exam with its papers, marks and report cards `(admin)`
- [ ] `GET /api/v1/exams/schedule?classId=` — dated schedule `(admin, teacher, student, parent of child)`
- [ ] `POST /api/v1/exams/:id/marks` — bulk marks entry: the sheet's changed cells, upserted on `(exam, student, subject)`; a mark above its paper's total is a 400 and a published exam a 409 `(admin, teacher)`
- [ ] `POST /api/v1/exams/:id/publish` — publish results (transaction: results → report cards → notifications) `(admin, teacher)`
- [ ] `POST /api/v1/exams/:id/unpublish` — admin-only rollback `(admin)`
- [ ] `GET /api/v1/results/student/:studentId?examId=` `(admin, teacher, student own, parent of child)`
- [ ] `GET /api/v1/report-cards/:studentId/:examId` — grades, percentage, rank, AI comment `(admin, teacher, student own, parent of child)`

**Behavior**

- A **test is one subject, an exam is many** — both live in `exams`, told apart by `kind`, so the Results tab enters
  marks for either through one code path. Only an `EXAM` produces report cards
- A list row's `status` is **derived**, never stored: `COMPLETED` once `endDate` has passed, `UPCOMING` otherwise
- Each paper carries its own `examDate`, `maxMarks` and `durationMin`; a mark above that paper's total is refused,
  so the ceiling is enforced per subject rather than per exam
- `POST /exams/:id/marks` upserts the cells the grid sends, and `remarks` is the teacher's free-text note beside a
  mark — it does not affect the grade
- Grade computation from school grading scheme (JSONB in School.settings)
- Results locked after publish; unpublish is admin-only
- `exams/me` is **self-scoped**: the student comes from the session, every row is drawn from their own class, and **only published marks are returned** — a result a teacher has not published is not yet the student's to read. It reuses the same rows the staff reads do, so a student's screen and the marks sheet cannot disagree
- The student's lists are the **upcoming** papers and windows, soonest first, while each tab's count is the whole record the class holds — a test already sat still counts in "Tests" but leaves the upcoming list, which is why a tab can read "Tests 2" over a single row

### 4.10 Real-Time Communication (`ChatModule` — Socket.io Gateway)

**Tables:** `conversations`, `conversation_participants`, `messages` · Database.md §10

**Events**

- [ ] JWT-authenticated handshake (guard on gateway `handleConnection`)
- [ ] `chat:join` — subscribe to a conversation once the allowed-pair check passes
- [ ] `chat:message` — persist first, then fan out to the participants
- [ ] `chat:typing` — ephemeral, never persisted
- [ ] `chat:read` — receipt, stamps `readAt`
- [ ] `notification:new` — notices, fee reminders, attendance alerts

**Endpoints (history/persistence)** — the gateway carries live traffic; these hydrate the client and keep history

- [ ] `POST /api/v1/chat/conversations` — allowed pairs enforced (admin↔teacher, teacher↔student, teacher↔parent) `(authenticated)`
- [ ] `GET /api/v1/chat/conversations` — the caller's conversations, newest `lastMessageAt` first; each row is the **inbox row** below `(authenticated)`
- [ ] `GET /api/v1/chat/:conversationId/messages` — paginated history, oldest first within a page; each row is the **history row** below, and a non-participant is refused (403) `(participant)`
- [ ] `POST /api/v1/chat/:conversationId/read` — mark read up to a message; stamps both the message's `readAt` and the caller's `lastReadAt` `(participant)`

**Read models** — the two reads above are shaped here, not in the client

- **Inbox row** — `id`, and for the other participant a `name` plus a `participantLabel` (a student's class, a
  teacher's subject, else their role), then `lastMessage` (the newest body), `lastMessageAt` and `unreadCount`
- **History row** — `id`, `body`, `mine` (`senderId` = caller), `sentAt` (`createdAt`), `read` (`readAt` not null)
- `unreadCount` counts the other side's messages newer than the caller's
  `conversation_participants.lastReadAt` — per-caller by construction and never a column on `conversations`, so
  the badge cannot drift between the two participants

**Behavior**

- `@socket-io/redis-adapter` (optional) for horizontal scaling
- Message persistence in PostgreSQL with read receipts (`readAt`); a read stamps both `messages.read_at` (the
  sender's double-check) and `conversation_participants.last_read_at` (the caller's unread marker)
- Both reads are **scoped to the caller**: the inbox lists only conversations the caller participates in, and a
  thread request from anyone else is refused (403) rather than returning history

### 4.11 Notices & Events (`NoticesModule`)

**Tables:** `notices`, `notice_classes`, `events` · Database.md §11

**Endpoints**

- [ ] `POST /api/v1/notices` — publish a notice (title, body, `priority`, optional `authorName`) + audience targeting (all/teachers/class through `notice_classes`) `(admin)`
- [ ] `GET /api/v1/notices` — role-filtered feed `(all roles)`
- [ ] `GET /api/v1/notices/:id` `(all roles)`
- [ ] `PATCH /api/v1/notices/:id` — edit; a draft is published by the edit `(admin)`
- [ ] `DELETE /api/v1/notices/:id` — soft delete (`deletedAt`) `(admin)`
- [ ] `POST /api/v1/events` — calendar entry `(admin)`
- [ ] `GET /api/v1/events` — filter by date range/audience `(all roles)`
- [ ] `GET /api/v1/events/:id` `(all roles)`
- [ ] `PATCH /api/v1/events/:id` `(admin)`
- [ ] `DELETE /api/v1/events/:id` `(admin)`
- [ ] Publish side effects — Socket broadcast + email notification on notice publish

**Behavior**

- A notice is created **published** (`publishedAt` = now) with `audience` defaulting to `ALL` — the board has no
  draft state, and editing a draft publishes it
- `priority` (`HIGH`/`MEDIUM`/`LOW`) sets the board card's tint; it does **not** reorder the feed, which stays
  newest-first (`publishedAt` desc)
- The board form collects title, body, `priority` and an optional `authorName` — a blank byline falls back to the
  publisher's display name from `published_by_id`
- `DELETE` is a soft delete (`deletedAt`): `GET /api/v1/notices` excludes deleted rows, so the notice leaves the
  feed while the record survives

### 4.12 AI Assistant (`AiModule`)

**Tables:** `ai_conversations` · Database.md §12

**Endpoints** — the seven `ai_feature` values from `Database.md`, one endpoint each: a server-side prompt template plus a throttled LLM call, history in `ai_conversations`

- [ ] `POST /api/v1/ai/chat` — school insights (admin): DB aggregates via Supabase RPC, answered by the LLM `(admin)`
- [ ] `POST /api/v1/ai/report-comment` — report card comment generator `(admin, teacher)`
- [ ] `POST /api/v1/ai/fee-reminder` — fee reminder message generator `(admin)`
- [ ] `POST /api/v1/ai/notice` — notice drafting: takes the notice **type** and the **details**, returns the announcement text `(admin)`
- [ ] `POST /api/v1/ai/event-plan` — event planner: takes the event **name**, **type**, **date**, expected **participants** and **budget**, returns a full plan (objectives, hour-by-hour timeline, budget split, checklist) `(admin)`
- [ ] `POST /api/v1/ai/homework-help` — student homework helper: takes an optional **subject** and the **question**, returns a step-by-step explanation `(student)`
- [ ] `POST /api/v1/ai/quiz` — quiz generator: takes **subject**, **topic** and the **question count**, returns the questions with their options `(student, teacher)`
- [ ] `GET /api/v1/ai/conversations` — the caller's own history, optionally filtered by `feature`, newest first. Each row is the **generation read model**: `id`, `feature`, `title`, `promptArgs` (the tool form's fields, so a past run can be reopened with its inputs), `output` (the last reply) and `createdAt` `(authenticated)`

**Behavior**

- Server-side prompt templates per feature; no raw user prompts to LLM
- Rate-limited per user (`@Throttle`); conversation history stored in `AiConversation` (JSONB messages)
- Four of the seven features own a screen (quiz, homework helper, event planner, notice) and each is offered
  only to the roles `§2` allows — a teacher sees the quiz, a student the quiz and the homework helper, and a
  guardian none of them
- A generation is two turns — the template-filled prompt, then the reply — and `prompt_args` keeps the form's
  own fields alongside them, so the tool can be re-run with the same inputs
- School insights grounded in real DB aggregations (attendance %, fee collection, performance)

### 4.13 Study Material Module (`MaterialsModule`)

**Tables:** `study_materials` · Database.md §6

**Endpoints**

- [ ] `POST /api/v1/materials` — upload (`FileInterceptor` → Cloudinary/Supabase Storage); multipart fields `classId`, `subjectId`, `type` (PDF/notes/worksheet/previous-year paper), `title`, optional `description` and the `file` part; 400 `MATERIAL_INVALID` when the class/subject/type/title is missing, the subject is not taught in the chosen class, or the file is not a PDF/JPG/PNG/DOCX ≤ 10MB `(admin, teacher)`
- [ ] `GET /api/v1/materials?search=&classId=&subjectId=&type=` — list, newest first `(all roles)`
- [ ] `GET /api/v1/materials/:id` — metadata + a short-lived signed URL `(all roles)`
- [ ] `DELETE /api/v1/materials/:id` — soft-deletes the row and removes the stored asset `(admin, teacher)`

**Behavior**

- A list row is a **read model**: the upload plus its joined class label, subject name and uploader display name, so the client renders what it is handed rather than resolving ids itself
- The list is **role-scoped** server-side — staff see the school, a student their own class, a parent their children's classes — and `search` matches the title, subject, class, uploader and description
- The file rules (PDF/JPG/PNG/DOCX, ≤ 10MB per `Design.md`) are validated **server-side**; the client's picker reads the same list, so it cannot accept a file the API would refuse
- `DELETE` is a **soft delete** of the row (`deleted_at`, per `Database.md` §6) alongside removal of the stored asset, so a removed material leaves the library without orphaning its storage key

### 4.14 Reports & Analytics (`ReportsModule`)

**Tables:** no tables — materialized views and RPC aggregates only · Database.md §16

**Endpoints**

- [ ] `GET /api/v1/reports/overview` — active students and teachers, collected and pending totals, the twelve-month collected-vs-pending series and the class catalogue `(admin, teacher)`
- [ ] `GET /api/v1/reports/attendance?month=&year=&classId=` — the register for one month: `present`, `total` and `percentage` per class plus the school totals `(admin, teacher)`
- [ ] `GET /api/v1/reports/exam-results/papers` — the selectable papers (one exam's subject for one class), completed exams only, newest exam first `(admin, teacher)`
- [ ] `GET /api/v1/reports/exam-results?paperId=` — one paper: every student's mark, percentage, grade and outcome, plus `totalStudents`/`passed`/`failed`/`averagePercentage` and the grade distribution; 404 `REPORT_PAPER_NOT_FOUND` for an unknown paper `(admin, teacher)`
- [ ] `GET /api/v1/reports/finance` — collected and pending totals, the collection rate, the twelve-month series and every invoice still carrying a balance (total, paid, balance, due date, status), soonest-due first `(admin, teacher)`
- [ ] `GET /api/v1/reports/students/:id` — academic profile report `(admin, teacher, parent of child)`
- [ ] `GET /api/v1/reports/export?type=&format=csv` — streaming CSV of any report above `(admin)`
- [ ] `GET /api/v1/dashboard/admin` — counts, collection stats, attendance rate plus its per-day trend, class performance per class, a recent-activity feed merged from payments/submissions/notices, upcoming exams (dated today or later), invoices with an outstanding balance, and dated calendar entries (events + exam days); chart series (Recharts-ready: plain labelled series, no chart config) `(admin)`
- [ ] `GET /api/v1/dashboard/student` — the caller's **own** day: attendance rate with the present/absent/late split and the last few register days, paid/pending/total fees with the invoice list and the paid share, today's teaching periods for their class, the papers still ahead, and the notices they are in the audience of `(student)` — 403 `DASHBOARD_FORBIDDEN` for a non-student account

**Behavior**

- The module owns **no tables**: every figure is aggregated from the modules that do — attendance, fees, exams, classes, people — the way the SQL/RPC projections in `Database.md` §16 would. Aggregations via SQL (`group by`/aggregate through Supabase RPC) and PostgreSQL materialized views for the heavy ones; CSV streaming export for large datasets
- **`dashboard/student` is self-scoped.** The student comes from the session, so no id appears in the path and an admin or teacher account is refused with `403 DASHBOARD_FORBIDDEN` rather than served someone else's day. Every figure reuses the read model the student's own screens already show — the register totals behind the profile's Attendance tab, the invoices behind Fee history, the class grid behind `/timetables/me` and the timetable module — so the dashboard and those screens cannot disagree
- On the student dashboard, fees are billed **net of concession** (`amount − discount − paid`), the same rule the roster and `/fees/collect` use, so `paid + pending = total` holds and `progress` is `paid ÷ total`; `today` is **`null` on a non-school day**, and **breaks are excluded** from the periods because a break is not a lesson
- Notices on the student dashboard are the **published** ones whose audience is `ALL` or `STUDENTS` and whose class targeting is empty or includes the student's own class — the same rule the board applies per role, so a class-targeted notice never reaches another class
- `reports/attendance` counts **present and late** as attended, and a class with no register day in the period is **omitted** rather than reported as zero — an empty month returns empty rows, not an error
- `reports/exam-results` reports **one paper**, not a whole exam, because the screen reads one subject at a time. A student with no mark (absent, or an unmarked paper) counts in `totalStudents` but is out of `passed`/`failed`/`averagePercentage`, and the grade distribution only carries the bands that occur, in the school's grade order (`docs/frontend/Design.md` bands via `gradeForPercentage`)
- `reports/finance` bills a row **net of concession** (`amount − discount`), so `total − paid = balance` holds on every row, and the collection rate is `collected ÷ (collected + pending)`
- `reports/overview` and `reports/finance` read the **same** twelve-month series as `GET /fees/dashboard`, so the two screens cannot disagree; the frontend exports its CSVs client-side, which is why `/reports/export` stays a documented server option for large datasets rather than the path the screens take

### 4.15 Email Notifications (`MailModule` — Resend)

**Tables:** no table — BullMQ email queue · Database.md §17

No HTTP endpoints — this module is called by the other services and by the scheduler.

**Templates & triggers**

- [ ] OTP verification (registration, password reset)
- [ ] Student invite — the verification link plus the generated login password
- [ ] Teacher/student/parent login credentials on creation
- [ ] Fee reminders (manual trigger + `@nestjs/schedule` cron)
- [ ] Result publication alerts
- [ ] Notice broadcasts

**Behavior**

- Email queue with retry (BullMQ + Redis)
- React Email (`.tsx`) templates in `src/mail/templates/`, rendered to HTML with `render()` and sent through Resend

### 4.16 Platform endpoints (no feature module)

**Tables:** none — platform endpoint

- [ ] `GET /api/v1/health` — liveness/readiness for the Render health check `(public)` (see §8)

---

## 5. API Conventions

**Methods** — `GET` reads; `POST` creates or triggers an action; `PATCH` for partial updates (send only the fields you change — the default for every update route); `PUT` only where the body replaces a whole sub-resource (`PUT /timetables/:id` replaces its `periods`); `DELETE` removes.

**Response envelope** (via global response interceptor)

```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 42 } }
```

**Error envelope** (via global exception filter)

```json
{ "success": false, "error": { "code": "FEE_NOT_FOUND", "message": "Invoice not found" } }
```

**Status codes** — 200 OK, 201 Created, 400 Validation, 401 Unauthenticated, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate Limited, 500 Server Error.

---

## 6. Security Requirements

- JWT access + refresh token rotation (Passport.js strategies)
- bcrypt (12 rounds) password hashing
- `JwtAuthGuard` + `RolesGuard` on every protected route; all queries scoped by `schoolId` (tenant guard)
- Protected APIs reject cross-school access
- Rate limiting (`@nestjs/throttler`): 5/min on OTP & login, 100/min general
- DTO validation (`class-validator`, global `ValidationPipe` with `whitelist: true`)
- Parameterized queries via the Supabase client (SQL-injection safe)
- Cloudinary signed uploads; file type/size validation (PDFs, images ≤ 10MB)
- Stripe signature verification and SSLCommerz IPN verification on all payment confirmations and webhooks
- No sensitive data (passwords, OTPs) in logs or responses (`ClassSerializerInterceptor` to strip fields)

---

## 7. Project Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase keys, JWT secrets, etc.
npm run start:dev
```

Apply the database schema to your Supabase project first: run the migrations in
`supabase/migrations` (Supabase SQL editor or CLI), or push with
`supabase db push`.

**Environment variables (.env)**

```
PORT=5000
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=           # public key — never used server-side for privileged queries
SUPABASE_SERVICE_ROLE_KEY=   # server-only; bypasses RLS — never expose to the client
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
RESEND_FROM=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_SANDBOX=
AI_API_KEY=
REDIS_URL=
CLIENT_URL=
```

**Folder structure (NestJS)**

```
backend/
├── supabase/
│   └── migrations/         # SQL migrations — source of truth for the DB schema
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── database/           # Supabase client module (global injectable service)
│   ├── common/             # guards, decorators, filters, interceptors, pipes
│   ├── auth/               # strategies, guards, dto
│   ├── schools/
│   ├── users/
│   ├── classes/
│   ├── attendance/
│   ├── fees/
│   ├── homework/
│   ├── timetables/
│   ├── exams/
│   ├── chat/               # gateway + service
│   ├── notices/
│   ├── ai/
│   ├── materials/
│   ├── reports/
│   └── mail/               # mailer + templates
├── package.json
└── .env
```

---

## 8. Deployment

- **API:** Render (Node service, `npm run build && npm run start:prod`, auto-deploy from repo)
- **DB:** Supabase PostgreSQL (schema managed via Supabase migrations; the backend connects with the service-role key)
- **Files:** Cloudinary or Supabase Storage
- Health check endpoint `GET /api/v1/health`
- Graceful shutdown (`app.enableShutdownHooks()`); Socket.io sticky sessions + Redis adapter for multi-instance deploys

---

## 9. Acceptance Criteria

1. School can register with OTP verification and configure settings.
2. All four roles can log in and only access permitted resources (RBAC enforced via guards).
3. Teacher marks daily/bulk attendance; monthly reports and analytics return correct aggregates.
4. Admin defines fee structures; students/parents pay online via Stripe or SSLCommerz with verified receipts; pending-fee report is accurate.
5. Homework lifecycle (create → submit → grade) works with file uploads.
6. Exams support marks entry, result publishing, and report card generation with AI comments.
7. Real-time chat delivers messages between permitted role pairs with persistence.
8. All seven AI assistant features return useful, rate-limited output.
9. All reports export to CSV.
10. Automated emails fire for OTP, credentials, fee reminders, and results.

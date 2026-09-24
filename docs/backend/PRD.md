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
| AI Assistant                     | all 7 | report-comment, quiz | homework-help, quiz | ❌           |
| Reports & exports                | ✅    | limited              | ❌                  | ❌           |

---

## 3. Data Models (PostgreSQL — Supabase)

All tables live in the Supabase project (`supabase/` migrations are the source of truth). All models include `id` (UUID), `schoolId` (FK → School), `createdAt`, `updatedAt` unless noted. Key enums: `Role`, `AttendanceStatus`, `PaymentStatus`, `ExamType`, `MaterialType`.

- **School** — name, address, contact, logo, subscriptionStatus, settings (JSONB), slug
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
- **Exam** — classId, name, type (`UNIT | MID | FINAL`), startDate, endDate
- **ExamSubject** — examId, subjectId, date, maxMarks
- **Result** — examId, studentId, subjectId, obtainedMarks
- **ReportCard** — examId, studentId, totalMarks, percentage, grade, rank, aiComment
- **Timetable** — classId, day (`MON`–`SUN`), periods → **Period** child table (startTime, endTime, subjectId, teacherId, isBreak)
- **StudyMaterial** — classId, subjectId, title, type (`PDF | NOTES | WORKSHEET | PAPER`), fileUrl
- **Notice** — title, body, audience (enum[] or JSONB), publishedById, publishedAt
- **Event** — title, date, description, audience
- **Conversation** — participants → **ConversationParticipant** join table; lastMessageAt
- **Message** — conversationId, senderId, body, readAt
- **Otp** — email, codeHash, expiresAt, attempts, purpose (`REGISTER | RESET_PASSWORD | INVITE`)
- **AiConversation** — userId, feature, messages (JSONB)

**Indexes**: `(schoolId)` on all tables; composite indexes on Attendance(classId, date), FeeInvoice(studentId, status), Message(conversationId, createdAt).

---

## 4. Feature Modules

Each module lists its endpoints as a **checklist — build one endpoint at a time**, controller route first, then service, DTO and guard. Build a module's list top to bottom: creation and reads unblock the frontend, aggregates and exports come last. `(public)` marks routes reachable without a session; every other route needs `JwtAuthGuard` + `RolesGuard` and the tenant scope in parentheses. Tick the item here, then its phase line in `Phases.md`. Tables each module touches are specified in `docs/backend/Database.md`.

### 4.1 School Registration & OTP Verification (`SchoolsModule`)

**Tables:** `schools`, `users`, `otps` · Database.md §3

**Endpoints**

- [ ] `POST /api/v1/schools/register` — create school + admin user, trigger OTP `(public)`
- [ ] `POST /api/v1/schools/verify-otp` — validate OTP, activate account `(public)`
- [ ] `POST /api/v1/schools/resend-otp` — resend within the 60s cooldown `(public)`
- [ ] `GET /api/v1/schools/current` — the caller's own school `(admin)` — the frontend already calls this
- [ ] `GET /api/v1/schools/:id/settings` — academic year, grading scheme, fee heads, branding `(admin)`
- [ ] `PATCH /api/v1/schools/:id/settings` — update settings `(admin)`

**Behavior**

- 6-digit OTP (bcrypt-hashed in `Otp` table), 10-minute expiry, max 5 attempts, resend cooldown 60s
- Email verification via Resend before admin login is allowed
- Unique school slug auto-generated
- Registration runs in a database transaction (school + admin user + OTP)

### 4.2 Authentication & RBAC (`AuthModule`)

**Tables:** `users`, `refresh_tokens` · Database.md §3

**Endpoints**

- [ ] `POST /api/v1/auth/login` — JWT (access 15m + refresh 7d) `(public)`
- [ ] `POST /api/v1/auth/refresh` — rotate the refresh token `(public)`
- [ ] `POST /api/v1/auth/logout` — revoke the stored refresh token `(authenticated)`
- [ ] `POST /api/v1/auth/forgot-password` — email the reset token `(public)`
- [ ] `POST /api/v1/auth/reset-password` — set a new password from the reset token `(public)`
- [ ] `POST /api/v1/auth/verify-invite` — confirm an invite with the emailed one-time code (an OTP of purpose `INVITE`), flipping the login to verified. Confirming twice succeeds rather than erroring, because an emailed link can be opened twice `(public)`
- [ ] `GET /api/v1/auth/me` — current user + school + role `(authenticated)`

**Behavior**

- Passport `JwtStrategy` + `JwtAuthGuard` (global); `RolesGuard` + `@Roles(Role.ADMIN)` decorator per route
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
- [ ] `POST /api/v1/students` — create + admission number; takes the **roll number** (next free in the class when omitted; 409 `STUDENT_ROLL_TAKEN` if already used) and the **guardian** block — name, email, phone, address — reusing an existing parent with that email rather than duplicating. Date of birth, gender and **blood group** are required on the profile. The student's own login is created **unverified** with a generated password, emailed with a verification link; the response carries the invite, never the password itself `(admin)`
- [ ] `GET /api/v1/students` — paginated; search name/roll/admission no./guardian; filter by class and fee standing; every row carries its class label, **roll number**, **attendance share**, **fee standing** and the **primary guardian's contact** (the admin roster and its profile panel read these straight off the list) `(admin)`
- [ ] `GET /api/v1/students/:id` — the profile: the roster row plus homeroom teacher, days present/absent and the current attendance streak `(admin, parent of child)`
- [ ] `GET /api/v1/students/:id/documents` — files held against the student; an empty list until uploads exist `(admin, teacher, parent of child)`
- [ ] `PATCH /api/v1/students/:id` — partial update of the same fields; a roll change is validated against the class the student ends up in `(admin)`
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
- Enrolment invites: creating a student (or a teacher/parent) provisions the login immediately but leaves it **unverified**, with a generated password and a verification link (`otp_purpose = INVITE`) sent by email. Sign-in is refused with 403 `AUTH_NOT_VERIFIED` until that link is confirmed, so a mistyped address can never become a live account.
- Credentials emailed on account creation
- Parent ↔ student linking via `ParentStudent` join table

### 4.4 Class & Subject Management (`ClassesModule`)

**Tables:** `classes`, `subjects` (+ `students.class_id`) · Database.md §4

**Endpoints**

- [ ] `POST /api/v1/classes` — grade/section `(admin)`
- [ ] `GET /api/v1/classes` — list with student counts `(admin)`
- [ ] `GET /api/v1/classes/:id` — class + roster `(admin, teacher)`
- [ ] `PATCH /api/v1/classes/:id` — including class-teacher assignment `(admin)`
- [ ] `DELETE /api/v1/classes/:id` `(admin)`
- [ ] `GET /api/v1/classes/:id/students` — roster `(admin, teacher)`
- [ ] `POST /api/v1/classes/:id/assign-students` — bulk roster move `(admin)`
- [ ] `POST /api/v1/subjects` — name, code, class, teacher `(admin)`
- [ ] `GET /api/v1/subjects` — filter by class/teacher `(admin, teacher)`
- [ ] `GET /api/v1/subjects/:id` `(admin, teacher)`
- [ ] `PATCH /api/v1/subjects/:id` `(admin)`
- [ ] `DELETE /api/v1/subjects/:id` `(admin)`

### 4.5 Attendance Management (`AttendanceModule`)

**Tables:** `attendance` · Database.md §5

**Endpoints**

- [ ] `POST /api/v1/attendance` — daily/bulk mark (array of records, batch upsert) `(admin, teacher)`
- [ ] `GET /api/v1/attendance?classId=&date=` — daily register `(admin, teacher)`
- [ ] `GET /api/v1/attendance/monthly?classId=&month=` — monthly summary `(admin, teacher)`
- [ ] `GET /api/v1/attendance/student/:id` — individual history `(admin, teacher, student own, parent of child)`
- [ ] `GET /api/v1/attendance/analytics?classId=` — trends and defaulters (<75%) `(admin, teacher)`
- [ ] `attendance:marked` socket event — notify the class's parents in real time

**Behavior**

- Unique (classId, studentId, date) constraint prevents duplicates
- Monthly %, streaks, and class analytics via SQL aggregations (Supabase RPC) / views
- Socket.io event `attendance:marked` notifies parents in real time

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

> Post-MVP: `Database.md` marks `timetables`/`periods` as `phase: none` and no phase claims them yet — build these after Phase 5.

**Endpoints**

- [ ] `POST /api/v1/timetables` — weekly timetable per class (nested create with periods) `(admin)`
- [ ] `GET /api/v1/timetables/class/:classId` `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/timetables/teacher/:teacherId` `(admin, teacher own)`
- [ ] `PUT /api/v1/timetables/:id` — **full replacement**: the body carries the whole period set, so this is the one route where `PUT` is correct `(admin)`
- [ ] `DELETE /api/v1/timetables/:id` `(admin)`

**Behavior**

- Conflict detection: teacher double-booking validation before save
- Break periods flagged via `isBreak` on Period

### 4.9 Exams, Tests & Report Cards (`ExamsModule`)

**Tables:** `exams`, `exam_subjects`, `results`, `report_cards` · Database.md §9

**Endpoints**

- [ ] `POST /api/v1/exams` — schedule with subjects and max marks `(admin, teacher)`
- [ ] `GET /api/v1/exams` — filter by class/type/status `(admin, teacher, student, parent of child)`
- [ ] `GET /api/v1/exams/:id` — exam with its subjects `(admin, teacher, student, parent of child)`
- [ ] `PATCH /api/v1/exams/:id` `(admin)`
- [ ] `DELETE /api/v1/exams/:id` `(admin)`
- [ ] `GET /api/v1/exams/schedule?classId=` — dated schedule `(admin, teacher, student, parent of child)`
- [ ] `POST /api/v1/exams/:id/marks` — bulk marks entry per class/subject (`upsert` per student/subject) `(admin, teacher)`
- [ ] `POST /api/v1/exams/:id/publish` — publish results (transaction: results → report cards → notifications) `(admin, teacher)`
- [ ] `POST /api/v1/exams/:id/unpublish` — admin-only rollback `(admin)`
- [ ] `GET /api/v1/results/student/:studentId?examId=` `(admin, teacher, student own, parent of child)`
- [ ] `GET /api/v1/report-cards/:studentId/:examId` — grades, percentage, rank, AI comment `(admin, teacher, student own, parent of child)`

**Behavior**

- Grade computation from school grading scheme (JSONB in School.settings)
- Results locked after publish; unpublish is admin-only

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
- [ ] `GET /api/v1/chat/conversations` — the caller's conversations, newest `lastMessageAt` first `(authenticated)`
- [ ] `GET /api/v1/chat/:conversationId/messages` — paginated history `(participant)`
- [ ] `POST /api/v1/chat/:conversationId/read` — mark read up to a message `(participant)`

**Behavior**

- `@socket-io/redis-adapter` (optional) for horizontal scaling
- Message persistence in PostgreSQL with read receipts (`readAt`)

### 4.11 Notices & Events (`NoticesModule`)

**Tables:** `notices`, `notice_classes`, `events` · Database.md §11

**Endpoints**

- [ ] `POST /api/v1/notices` — audience targeting (all/teachers/class through `notice_classes`) `(admin)`
- [ ] `GET /api/v1/notices` — role-filtered feed `(all roles)`
- [ ] `GET /api/v1/notices/:id` `(all roles)`
- [ ] `PATCH /api/v1/notices/:id` `(admin)`
- [ ] `DELETE /api/v1/notices/:id` `(admin)`
- [ ] `POST /api/v1/events` — calendar entry `(admin)`
- [ ] `GET /api/v1/events` — filter by date range/audience `(all roles)`
- [ ] `GET /api/v1/events/:id` `(all roles)`
- [ ] `PATCH /api/v1/events/:id` `(admin)`
- [ ] `DELETE /api/v1/events/:id` `(admin)`
- [ ] Publish side effects — Socket broadcast + email notification on notice publish

### 4.12 AI Assistant (`AiModule`)

**Tables:** `ai_conversations` · Database.md §12

**Endpoints** — the seven `ai_feature` values from `Database.md`, one endpoint each: a server-side prompt template plus a throttled LLM call, history in `ai_conversations`

- [ ] `POST /api/v1/ai/chat` — school insights (admin): DB aggregates via Supabase RPC, answered by the LLM `(admin)`
- [ ] `POST /api/v1/ai/report-comment` — report card comment generator `(admin, teacher)`
- [ ] `POST /api/v1/ai/fee-reminder` — fee reminder message generator `(admin)`
- [ ] `POST /api/v1/ai/notice` — notice drafting `(admin)`
- [ ] `POST /api/v1/ai/event-plan` — event planner `(admin)`
- [ ] `POST /api/v1/ai/homework-help` — student homework helper `(student)`
- [ ] `POST /api/v1/ai/quiz` — quiz generator (topic, class level, count → JSON questions) `(student, teacher)`
- [ ] `GET /api/v1/ai/conversations` — the caller's own history, optionally filtered by feature `(authenticated)`

**Behavior**

- Server-side prompt templates per feature; no raw user prompts to LLM
- Rate-limited per user (`@Throttle`); conversation history stored in `AiConversation` (JSONB messages)
- School insights grounded in real DB aggregations (attendance %, fee collection, performance)

### 4.13 Study Material Module (`MaterialsModule`)

**Tables:** `study_materials` · Database.md §6

**Endpoints**

- [ ] `POST /api/v1/materials` — upload (`FileInterceptor` → Cloudinary/Supabase Storage); type: PDF/notes/worksheet/previous-year paper `(admin, teacher)`
- [ ] `GET /api/v1/materials?classId=&subjectId=&type=` — list `(all roles)`
- [ ] `GET /api/v1/materials/:id` — metadata + signed URL `(all roles)`
- [ ] `DELETE /api/v1/materials/:id` — removes the row and the stored asset `(admin, teacher)`

### 4.14 Reports & Analytics (`ReportsModule`)

**Tables:** no tables — materialized views and RPC aggregates only · Database.md §16

**Endpoints**

- [ ] `GET /api/v1/reports/attendance?from=&to=&classId=` — attendance aggregates `(admin, teacher)`
- [ ] `GET /api/v1/reports/financial?from=&to=` — collected/pending/concessions `(admin)`
- [ ] `GET /api/v1/reports/students/:id` — academic profile report `(admin, teacher, parent of child)`
- [ ] `GET /api/v1/reports/export?type=&format=csv` — streaming CSV of any report above `(admin)`
- [ ] `GET /api/v1/dashboard/admin` — counts, collection stats, attendance rate plus its per-day trend, class performance per class, a recent-activity feed merged from payments/submissions/notices, upcoming exams (dated today or later), invoices with an outstanding balance, and dated calendar entries (events + exam days); chart series (Recharts-ready: plain labelled series, no chart config) `(admin)`

**Behavior**

- Aggregations via SQL (`group by`/aggregate through Supabase RPC) and PostgreSQL materialized views for heavy reports
- CSV streaming export for large datasets

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

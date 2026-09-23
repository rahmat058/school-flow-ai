# Backend PRD — School Management System (NestJS + PostgreSQL/Supabase)

## 1. Overview

### 1.1 Purpose

Build the complete backend for a multi-role School Management System using **NestJS and Supabase (PostgreSQL)**, serving a React.js frontend. The backend powers Admin, Teacher, Student, and Parent dashboards with attendance, fees, homework, exams, AI assistance, real-time chat, reports, and role-based security.

> Feature scope is aligned with the complete school-management feature set: school registration with OTP, dashboard analytics, student/teacher/parent management, class & subject management, school settings, attendance (daily/bulk/monthly/analytics), fee management (structures, collection, pending, history, reports, concessions), homework with submissions, timetables, tests & exams with report cards, study materials (PDFs, notes, worksheets, previous-year papers), real-time chat between permitted role pairs, notices & events, an 8-feature AI assistant, reports with CSV export, JWT/bcrypt security, and automated emails.

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
| Email        | Nodemailer (SMTP)                                                       |
| Payments     | Razorpay                                                                |
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

| Module                           | Admin | Teacher  | Student            | Parent       |
| -------------------------------- | ----- | -------- | ------------------ | ------------ |
| School registration/settings     | ✅    | ❌       | ❌                 | ❌           |
| User management (CRUD)           | ✅    | ❌       | ❌                 | ❌           |
| Class/Subject management         | ✅    | ❌       | ❌                 | ❌           |
| Attendance (mark)                | ✅    | ✅       | ❌                 | ❌           |
| Attendance (view)                | ✅    | ✅       | own                | child's      |
| Homework (create)                | ✅    | ✅       | ❌                 | ❌           |
| Homework (submit/view)           | ✅    | ✅       | ✅                 | child's      |
| Fees (structure/collect/reports) | ✅    | ❌       | pay own            | pay child's  |
| Exams (create/publish)           | ✅    | ✅       | view               | view child's |
| Timetable                        | ✅    | view own | view own           | view child's |
| Study material (upload)          | ✅    | ✅       | download           | view         |
| Notices (publish)                | ✅    | ❌       | view               | view         |
| Chat                             | ✅    | ✅       | ✅                 | ✅           |
| AI Assistant                     | ✅    | ✅       | ✅ (homework/quiz) | ❌           |
| Reports & exports                | ✅    | limited  | ❌                 | ❌           |

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
- **FeePayment** — invoiceId, studentId, amount, method, razorpayOrderId, razorpayPaymentId, paidAt
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
- **Otp** — email, codeHash, expiresAt, attempts, purpose (`REGISTER | RESET_PASSWORD`)
- **AiConversation** — userId, feature, messages (JSONB)

**Indexes**: `(schoolId)` on all tables; composite indexes on Attendance(classId, date), FeeInvoice(studentId, status), Message(conversationId, createdAt).

---

## 4. Feature Modules

### 4.1 School Registration & OTP Verification (`SchoolsModule`)

**Endpoints**

- `POST /api/v1/schools/register` — create school + admin user, trigger OTP
- `POST /api/v1/schools/verify-otp` — validate OTP, activate account
- `POST /api/v1/schools/resend-otp`
- `GET/PUT /api/v1/schools/:id/settings` — school settings (academic year, grading scheme, fee heads, branding)

**Behavior**

- 6-digit OTP (bcrypt-hashed in `Otp` table), 10-minute expiry, max 5 attempts, resend cooldown 60s
- Email verification via Nodemailer before admin login is allowed
- Unique school slug auto-generated
- Registration runs in a database transaction (school + admin user + OTP)

### 4.2 Authentication & RBAC (`AuthModule`)

**Endpoints**

- `POST /api/v1/auth/login` — JWT (access 15m + refresh 7d)
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password` / `reset-password`
- `GET /api/v1/auth/me`

**Behavior**

- Passport `JwtStrategy` + `JwtAuthGuard` (global); `RolesGuard` + `@Roles(Role.ADMIN)` decorator per route
- bcrypt hashing (12 rounds)
- Refresh token rotation; hashed refresh tokens stored server-side
- Teachers/students/parents receive auto-generated credentials via email on creation

### 4.3 User Management (`UsersModule` — Admin only)

**Endpoints**

- `POST /api/v1/teachers`, `POST /api/v1/students`, `POST /api/v1/parents`
- `GET /api/v1/:role` — list with pagination, search, filters (class, status)
- `GET/PUT/DELETE /api/v1/:role/:id` (soft delete via `deletedAt`)
- `POST /api/v1/students/bulk-import` — CSV import (parsed + validated row-by-row, transaction per batch)
- `POST /api/v1/parents/:id/link-student`

**Behavior**

- Auto-generated admission/employee numbers (per-school sequence)
- Credentials emailed on account creation
- Parent ↔ student linking via `ParentStudent` join table

### 4.4 Class & Subject Management (`ClassesModule`)

- `CRUD /api/v1/classes` — grade/section, assign class teacher, student roster
- `CRUD /api/v1/subjects` — assign subject to class + teacher
- `POST /api/v1/classes/:id/assign-students`

### 4.5 Attendance Management (`AttendanceModule`)

**Endpoints**

- `POST /api/v1/attendance` — daily/bulk mark (array of records, batch upsert)
- `GET /api/v1/attendance?classId=&date=` — daily register
- `GET /api/v1/attendance/monthly?classId=&month=`
- `GET /api/v1/attendance/student/:id` — individual history
- `GET /api/v1/attendance/analytics?classId=` — trends, defaulters (<75%)

**Behavior**

- Unique (classId, studentId, date) constraint prevents duplicates
- Monthly %, streaks, and class analytics via SQL aggregations (Supabase RPC) / views
- Socket.io event `attendance:marked` notifies parents in real time

### 4.6 Fee Management (`FeesModule`)

**Endpoints**

- `CRUD /api/v1/fees/structures`
- `POST /api/v1/fees/invoices/generate` — bulk invoice generation per class (transactional batch insert)
- `POST /api/v1/fees/payments/razorpay-order` — create order
- `POST /api/v1/fees/payments/verify` — signature verification (Razorpay webhook-safe)
- `POST /api/v1/fees/payments/manual` — admin records cash/cheque payment
- `GET /api/v1/fees/pending?classId=`
- `GET /api/v1/fees/history/:studentId`
- `CRUD /api/v1/fees/concessions` (admin approval flow)
- `GET /api/v1/fees/reports?from=&to=` — collection reports + CSV export

**Behavior**

- Atomic payment confirmation in a database transaction (payment + invoice status + receipt number sequence)
- `POST /api/v1/webhooks/razorpay` for payment events
- AI fee-reminder text generator (see §4.12)

### 4.7 Homework & Assignment Module (`HomeworkModule`)

**Endpoints**

- `POST /api/v1/homework` — teacher creates with attachments (Cloudinary)
- `GET /api/v1/homework?classId=&subjectId=`
- `PUT/DELETE /api/v1/homework/:id`
- `POST /api/v1/homework/:id/submit` — student uploads submission
- `GET /api/v1/homework/:id/submissions` — teacher tracking (submitted/pending via count aggregates)
- `PUT /api/v1/homework/submissions/:id/grade`

**Behavior**

- `isLate` computed against `dueDate` on submission
- Parent visibility into child's homework status

### 4.8 Timetable Management (`TimetablesModule`)

**Endpoints**

- `POST /api/v1/timetables` — admin builds weekly timetable per class (nested create with periods)
- `GET /api/v1/timetables/class/:classId`
- `GET /api/v1/timetables/teacher/:teacherId`
- `PUT /api/v1/timetables/:id`

**Behavior**

- Conflict detection: teacher double-booking validation before save
- Break periods flagged via `isBreak` on Period

### 4.9 Exams, Tests & Report Cards (`ExamsModule`)

**Endpoints**

- `CRUD /api/v1/exams` — create exam schedule (dates, subjects, max marks)
- `POST /api/v1/exams/:id/marks` — bulk marks entry per class/subject (`upsert` per student/subject)
- `POST /api/v1/exams/:id/publish` — publish results (transaction: results → report cards → notifications)
- `GET /api/v1/exams/schedule?classId=`
- `GET /api/v1/results/student/:studentId?examId=`
- `GET /api/v1/report-cards/:studentId/:examId` — grades, percentage, rank, AI comment

**Behavior**

- Grade computation from school grading scheme (JSONB in School.settings)
- Results locked after publish; unpublish is admin-only

### 4.10 Real-Time Communication (`ChatModule` — Socket.io Gateway)

**Events**

- JWT-authenticated handshake (guard on gateway `handleConnection`)
- `chat:join` / `chat:message` / `chat:typing` / `chat:read`
- `notification:new` — notices, fee reminders, attendance alerts

**Endpoints (history/persistence)**

- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/:conversationId/messages`
- `POST /api/v1/chat/conversations` — allowed pairs enforced (admin↔teacher, teacher↔student, teacher↔parent)

**Behavior**

- `@socket-io/redis-adapter` (optional) for horizontal scaling
- Message persistence in PostgreSQL with read receipts (`readAt`)

### 4.11 Notices & Events (`NoticesModule`)

- `CRUD /api/v1/notices` — audience targeting (all/teachers/class)
- `CRUD /api/v1/events` — event calendar
- Socket broadcast + email notification on publish

### 4.12 AI Assistant (`AiModule`)

**Endpoints**

- `POST /api/v1/ai/chat` — school insights chat (admin): queries DB aggregates via Supabase RPC, answers via LLM
- `POST /api/v1/ai/report-comment` — report card comment generator
- `POST /api/v1/ai/fee-reminder` — fee reminder message generator
- `POST /api/v1/ai/notice` — notice drafting
- `POST /api/v1/ai/event-plan` — event planner
- `POST /api/v1/ai/homework-help` — student homework helper
- `POST /api/v1/ai/quiz` — quiz generator (topic, class level, count → JSON questions)

**Behavior**

- Server-side prompt templates per feature; no raw user prompts to LLM
- Rate-limited per user (`@Throttle`); conversation history stored in `AiConversation` (JSONB messages)
- School insights grounded in real DB aggregations (attendance %, fee collection, performance)

### 4.13 Study Material Module (`MaterialsModule`)

**Endpoints**

- `POST /api/v1/materials` — upload (`FileInterceptor` → Cloudinary/Supabase Storage), type: PDF/notes/worksheet/previous-year paper
- `GET /api/v1/materials?classId=&subjectId=&type=`
- `DELETE /api/v1/materials/:id` — removes stored asset

### 4.14 Reports & Analytics (`ReportsModule`)

**Endpoints**

- `GET /api/v1/reports/attendance?from=&to=&classId=`
- `GET /api/v1/reports/financial?from=&to=` — collected/pending/concessions
- `GET /api/v1/reports/students/:id` — academic profile report
- `GET /api/v1/reports/export?type=&format=csv`
- `GET /api/v1/dashboard/admin` — counts, collection stats, attendance today, charts data (Chart.js-ready)

**Behavior**

- Aggregations via SQL (`group by`/aggregate through Supabase RPC) and PostgreSQL materialized views for heavy reports
- CSV streaming export for large datasets

### 4.15 Email Notifications (`MailModule` — Nodemailer)

Triggered emails:

- OTP verification (registration, password reset)
- Teacher/student/parent login credentials on creation
- Fee reminders (manual + scheduled via `@nestjs/schedule` cron)
- Result publication alerts
- Notice broadcasts

**Behavior**

- Email queue with retry (BullMQ + Redis)
- Handlebars HTML templates in `src/mail/templates/`

---

## 5. API Conventions

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
- Razorpay signature verification on all payment confirmations and webhooks
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
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
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
4. Admin defines fee structures; students/parents pay online via Razorpay with verified receipts; pending-fee report is accurate.
5. Homework lifecycle (create → submit → grade) works with file uploads.
6. Exams support marks entry, result publishing, and report card generation with AI comments.
7. Real-time chat delivers messages between permitted role pairs with persistence.
8. All seven AI assistant features return useful, rate-limited output.
9. All reports export to CSV.
10. Automated emails fire for OTP, credentials, fee reminders, and results.

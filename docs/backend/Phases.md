# Phases — Backend

> The endpoint-level checklist for each item lives in `docs/backend/PRD.md` §4 — build and tick one
> endpoint at a time there, then tick the matching line here. **Phase 1 blocks everything; Phase 2
> blocks 3–5.** Do not start a phase before its blockers are done.
>
> **`frontend/src/services/mockAdapter.ts` is the current implementation of record.** The mock already
> serves most of the endpoints these phases list; each phase's `PRD §4.x` reference names the modules it
> builds, and the mock's routes and payloads are the contract those modules build to.

## Phase 1: Foundation & Auth — PRD §4.1, §4.2, §4.15

- [ ] NestJS scaffold, config module, global pipes/filters/interceptors, helmet, CORS, throttler
- [ ] TypeORM DataSource module (`database/`) with entities (`schools`, `users` incl. the email-verification columns, `teachers`/`students`/`parents`) — schema applied by hand, `synchronize` off
- [x] Email-verified school registration — `POST /schools/register` (transactional create + emailed verification link), `POST /auth/verify-email`, `POST /auth/resend-verification` (single-use SHA-256-hashed token, 24-hour expiry)
- [ ] School settings — `GET`/`PATCH /schools/current` (profile), `PATCH /schools/current/settings` (academic · notifications · security) and `POST /schools/current/backup`
- [ ] MailModule (Resend) with React Email templates (`src/mail/templates/`) for the verification-link + credentials messages
- [x] JWT login/refresh/logout — `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] Password recovery — `POST /auth/forgot-password`, `POST /auth/reset-password`
- [ ] `GET /auth/me` plus `JwtAuthGuard`, `RolesGuard`, `@Roles()` decorator and the tenant guard
- [ ] Permissions — `GET /permissions` (the catalogue), `GET /permissions/staff`, `GET`/`PUT /users/:userId/permissions`, plus `@RequirePermission()` + `PermissionsGuard`; a new account's grants are seeded from the PRD §2 role matrix

> **Live (2026-09-27):** school registration + emailed verification, login/refresh/logout, `GET /auth/me`,
> the global `JwtAuthGuard`, the response interceptor + exception filter, helmet/CORS and the health
> route are built and covered by `test/auth/` and `test/health/` — see `PRD.md` §4.1, §4.2 and §4.16 for
> the per-endpoint ticks. Still open in this phase: `@nestjs/throttler`, the `teachers`/`students`/
> `parents` entities, school settings, password recovery, the unwired `RolesGuard`/tenant guard and
> permissions. The MailModule carries the verification-link template only; the invite/credentials
> messages land with Phase 2.

**Done when:** a school registers and verifies by email link, the admin logs in, and a protected route rejects wrong roles.

> Email verification stays in Phase 1 rather than moving later: nothing downstream can be exercised
> without a verified admin and a working JWT, so it is a hard blocker for every other module.
> OTP (the registration code and the password-reset code in the planned `otps` table) is **deferred** —
> re-introduce it later on top of this verified-account flow.

## Phase 2: Core Domain — PRD §4.3, §4.4

- [ ] Users module: teacher / student / parent CRUD, credential emails, auto-generated admission + employee numbers
- [ ] Student CSV bulk import (row-by-row validation, transaction per batch)
- [ ] Parent ↔ student linking (`parent_students`): list linked children, link and unlink
- [ ] Classes CRUD, class-teacher assignment, student roster + `assign-students`
- [ ] Subjects CRUD and class/teacher assignment

**Done when:** admin can provision a full school (people, classes, subjects) via API.

> **Post-MVP:** the timetable builder (PRD §4.8) belongs to no phase — `Database.md` tags
> `timetables`/`periods` as `phase: none`, matching the frontend's "Timetable builder UI is post-MVP".

## Phase 3: Attendance & Homework — PRD §4.5, §4.7, §4.13

- [ ] Attendance mark (daily/bulk upsert), daily register, class + personal month registers (`/attendance/monthly`, `/attendance/me`), student history, analytics, defaulters
- [ ] `attendance:marked` socket event for parent alerts
- [ ] Homework CRUD, submissions, grading, late flag
- [ ] Study materials upload (Cloudinary) + listing + deletion of the stored asset

**Done when:** attendance analytics return correct aggregates and the homework lifecycle completes.

## Phase 4: Fees & Exams — PRD §4.6, §4.9, §4.14

- [ ] Fee structures + fee heads, bulk invoice generation, invoice list/detail, pending list, payment history, summary — where the self-service pair (`/fees/me`, `/fees/me/payments`) a student and a guardian share is already defined
- [ ] Stripe + SSLCommerz order/create, verify, both webhooks, and manual payment recording — receipt sequence inside one transaction
- [ ] Concessions with the admin approval flow
- [ ] Exams CRUD, marks entry, publish (+ unpublish), report cards with grade computation and AI comments, and the student's own tests/exams/marks read (`/exams/me`) — which a guardian also reads for their own child via `?studentId=`
- [ ] Reports module: attendance/financial/student reports, CSV export, the admin + student dashboard endpoints, the guardian's own child dashboard (`/dashboard/parent`) and the student's own progress read (`/progress/me`)

**Done when:** a payment confirms atomically via webhook and a published report card is generated.

## Phase 5: Communication & AI — PRD §4.10, §4.11, §4.12

- [ ] Notices & events CRUD with audience targeting + publish side effects (socket broadcast + email)
- [ ] Chat gateway: JWT handshake, `chat:join`/`chat:message`/`chat:typing`/`chat:read`, allowed-pair enforcement
- [ ] Chat REST history: conversations, paginated messages, read receipts
- [ ] AI module: 7 features (the `ai_feature` enum) with prompt templates — `/ai/chat` role-scoped (school insights for an admin, a tutor for a student) — per-user rate limits, history in `ai_conversations`, and the assistant's own `GET /ai/context`

**Done when:** permitted role pairs chat in real time and every AI feature returns output.

## Phase 6: Hardening & Deploy — PRD §4.16

- [ ] Rate-limit tuning, security review pass, log scrubbing
- [ ] BullMQ email queue + fee reminder cron
- [ ] Health endpoint, graceful shutdown, Render deploy + Supabase production config

**Done when:** all acceptance criteria in `docs/backend/PRD.md` §9 pass in production.

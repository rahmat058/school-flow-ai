# Phases — Backend

## Phase 1: Foundation & Auth

- [ ] NestJS scaffold, Supabase client module (`database/`) + base schema migration (`supabase/migrations`: School, User, profiles, Otp)
- [ ] Global pipes, filters, interceptors, helmet, CORS, throttler
- [ ] School registration + OTP verification + resend
- [ ] JWT login/refresh/logout, forgot/reset password, `JwtAuthGuard` + `RolesGuard` + tenant guard
- [ ] MailModule with credential/OTP templates

**Done when:** a school registers with OTP, admin logs in, and a protected route rejects wrong roles.

## Phase 2: Core Domain

- [ ] Users module: teachers/students/parents CRUD, credential emails, CSV bulk import, parent↔student linking
- [ ] Classes & subjects CRUD, class teacher assignment, student roster

**Done when:** admin can provision a full school (people, classes, subjects) via API.

## Phase 3: Attendance & Homework

- [ ] Attendance mark (daily/bulk upsert), daily register, monthly reports, analytics, defaulters
- [ ] Homework CRUD, submissions, grading, late flag
- [ ] Study materials upload (Cloudinary) + listing

**Done when:** attendance analytics return correct aggregates and homework lifecycle completes.

## Phase 4: Fees & Exams

- [ ] Fee structures, bulk invoice generation, pending/history, concessions
- [ ] Razorpay order + verify + webhook + manual payment, receipt sequence (transactional)
- [ ] Exams CRUD, marks entry, publish, report cards with grade computation
- [ ] Reports module: attendance/financial/student reports + CSV export + admin dashboard endpoint

**Done when:** a payment confirms atomically via webhook and a published report card is generated.

## Phase 5: Communication & AI

- [ ] Notices & events CRUD with audience targeting + broadcasts
- [ ] Chat gateway: JWT handshake, conversations, messages, read receipts, allowed-pair enforcement
- [ ] AI module: 8 features with prompt templates, rate limits, history storage

**Done when:** permitted role pairs chat in real time and all AI features return output.

## Phase 6: Hardening & Deploy

- [ ] Rate-limit tuning, security review pass, log scrubbing
- [ ] BullMQ email queue + fee reminder cron
- [ ] Health endpoint, graceful shutdown, Render deploy + Supabase production config

**Done when:** all acceptance criteria in `docs/backend/PRD.md` §9 pass in production.

> Dependencies: Phase 1 blocks everything. Phase 2 blocks 3–5. Do not start a phase before its blockers are done.

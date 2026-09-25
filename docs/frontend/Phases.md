# Phases — Frontend

## Phase 1: Foundation & Auth

- [x] App shell (Sidebar, Header, AppShell) with role-aware navigation
- [x] Login, OTP verification, forgot/reset password screens
- [x] Auth session store + protected routes per role
- [x] API client service with JWT attach + error envelope handling

**Done when:** a user can log in and land on a role-correct dashboard shell.

> Complete on demo data. The backend is not implemented yet, so `src/services/mockAdapter.ts` answers
> every endpoint from `src/data/`. Switching to the live API is `VITE_ENABLE_MOCKS=false` — no
> component or hook changes.

## Phase 2: Admin Core

- [ ] Dashboard analytics (stat cards, charts from real API)
- [x] Student dashboard (own timetable, attendance, fees, exams and notices)
- [ ] Students / Teachers / Parents management tables + forms
- [x] Classes & subjects management
- [x] School settings page

**Done when:** admin can CRUD all core entities against the live API.

## Phase 3: Attendance & Homework

- [x] Teacher daily/bulk attendance register (mark + bulk upsert)
- [x] Attendance month view — a student's own or a guardian's child's, and a class's for staff (month picker, month totals, day-by-day register)
- [ ] Homework create/submit/track/grade flows
- [x] Study material listing & upload UI

**Done when:** a teacher marks attendance and assigns homework; student submits; parent sees both.

## Phase 4: Fees & Exams

- [ ] Fees module — Dashboard (cards, collection charts, pending/defaulter list), Fee structure (per-class fee heads), Collect fee (class-wise status → individual collect page, invoice from structure, manual payment + printable receipt), Reports (day book, class report, defaulters, student ledger + CSV) and Concessions
- [ ] Stripe / SSLCommerz checkout integration
- [ ] Exam schedule, marks entry, publish, report card view
- [x] Student tests & exams view (own Tests / Exams / My Results tabs, with the result summary and subject averages)
- [x] Reports screens with CSV export
- [x] Student progress tracking (Overall GPA, class rank, performance trend, subject-vs-class comparison and teacher remarks)

**Done when:** a parent pays a fee online and views a published report card.

## Phase 5: Communication & AI

- [ ] Notices & events feed
- [ ] Real-time chat (Socket.io) with conversation list + message pane
- [ ] AI assistant screens (chat, quiz, homework helper, generators)

**Done when:** two roles exchange real-time messages; AI features work end-to-end.

## Phase 6: Polish

- [ ] Responsive pass (mobile/tablet)
- [ ] Loading, empty, and error states everywhere
- [ ] Accessibility pass (focus, contrast, labels)
- [ ] Production build + Vercel deploy

**Done when:** app passes lint/typecheck, is responsive, and is deployed.

> Do not start Phase N+1 UI until Phase N is merged. The **weekly timetable** (class week view, per-cell subject/teacher editing, class-wide period rows) ships against the mock API, out of phase order as the fees and homework modules did; the drag-and-drop timetable **builder** UI stays post-MVP.

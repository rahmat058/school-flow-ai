# Phases — Frontend

## Phase 1: Foundation & Auth

- [ ] App shell (Sidebar, Header, AppShell) with role-aware navigation
- [ ] Login, OTP verification, forgot/reset password screens
- [ ] Auth context + protected routes per role
- [ ] API client service with JWT attach + error envelope handling

**Done when:** a user can log in and land on a role-correct dashboard shell.

## Phase 2: Admin Core

- [ ] Dashboard analytics (stat cards, charts from real API)
- [ ] Students / Teachers / Parents management tables + forms
- [ ] Classes & subjects management
- [ ] School settings page

**Done when:** admin can CRUD all core entities against the live API.

## Phase 3: Attendance & Homework

- [ ] Teacher daily/bulk attendance register
- [ ] Student/parent attendance views + monthly charts
- [ ] Homework create/submit/track/grade flows
- [ ] Study material listing & upload UI

**Done when:** a teacher marks attendance and assigns homework; student submits; parent sees both.

## Phase 4: Fees & Exams

- [ ] Fee structures, invoices, pending list, history
- [ ] Stripe / SSLCommerz checkout integration
- [ ] Exam schedule, marks entry, publish, report card view
- [ ] Reports screens with CSV export

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

> Do not start Phase N+1 UI until Phase N is merged. Timetable builder UI is post-MVP.

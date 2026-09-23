# PRD — School Flow AI (Frontend)

## What to build

A multi-role School Management System web app built with React (Vite + TypeScript), serving four dashboards — Admin, Teacher, Student, and Parent — on top of the NestJS/Supabase backend. It covers attendance, fees, homework, exams, timetable, real-time chat, AI assistant, and reports in a modern, responsive UI.

**Core problem:** schools juggle disconnected tools for attendance, fees, homework, and communication. This app unifies them into one role-aware interface.

**Success criteria**

- Each role logs in and lands on a dashboard tailored to their permissions
- Admin can manage students, teachers, classes, fees, and view analytics without leaving the app
- Teacher can mark attendance and post homework in under 3 clicks
- Student/Parent can see attendance, fees, homework, and results in real time

## Target users

- **Primary:** School Admin — manages people, classes, fees, settings; needs dense, data-rich screens
- **Secondary:** Teacher (attendance, homework, marks), Student (homework, materials, fees, AI helper), Parent (child's progress, fees, notices)
- **Gap:** existing tools are single-purpose (attendance-only, fee-only) with poor UX and no AI assistance

## Features

### MVP

- [ ] Auth screens — login, OTP verification, forgot/reset password
- [ ] Admin dashboard — analytics, students, teachers, parents, classes, subjects, settings
- [ ] Teacher dashboard — attendance marking, homework, timetable, marks entry
- [ ] Student dashboard — attendance, homework, study material, fee payment, exam schedule, report card
- [ ] Parent dashboard — child attendance, fee status, results, notices, progress
- [ ] Attendance UI — daily register, bulk mark, monthly view, analytics charts
- [ ] Fee UI — structure, invoices, payment checkout (Stripe / SSLCommerz), payment history, pending list
- [ ] Homework UI — create, submit, track, grade
- [ ] Exams UI — schedule, results, report cards
- [ ] Notices & events feed
- [ ] Real-time chat (Socket.io client)
- [ ] Reports with CSV export and Chart.js/Recharts visualizations

### Post-MVP

- [ ] AI Assistant screens — chat, quiz generator, homework helper, notice/report-comment generators
- [ ] Timetable builder UI with drag-and-drop
- [ ] Dark mode
- [ ] PWA / offline attendance marking

### Out of scope (v1)

- Native mobile apps
- Multi-language UI
- Video conferencing / online classes

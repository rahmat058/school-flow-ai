# Memory — Frontend

## Completed

- 2026-09-21 — Project scaffold: Vite + React 19 + TS + Tailwind 4, dashboard shell components (AppShell, Header, Sidebar, StatCard, StatGrid, RevenueChart, TransactionsTable, InsightsCard) with mock data in `src/data/dashboard.ts`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (PRD, Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Added frontend dependencies: zustand, framer-motion, date-fns, @react-pdf/renderer. Docs (Architecture tech stack, Memory decisions) updated to record them.

## Currently working on

- File: —
- Task: Phase 1 — auth screens + API client wiring to NestJS backend
- Blocker: backend API not yet implemented

## Decisions

- Backend is NestJS + PostgreSQL via Supabase — all API calls target `/api/v1`
- Recharts (not Chart.js) for charts — already installed
- State: Zustand for global state (auth/session, school context) — no Redux
- Animations: framer-motion for UI transitions
- Dates: date-fns for formatting and academic-calendar helpers
- Reports: @react-pdf/renderer for PDF export (report cards, invoices)
- Mock data in `src/data/` is temporary; replace with API calls per phase
- Design tokens follow `docs/frontend/Design.md` — indigo primary, 4px grid

# Memory — Frontend

## Completed

- 2026-09-21 — Project scaffold: Vite + React 19 + TS + Tailwind 4, dashboard shell components (AppShell, Header, Sidebar, StatCard, StatGrid, RevenueChart, TransactionsTable, InsightsCard) with mock data in `src/data/dashboard.ts`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (PRD, Architecture, Rules, Phases, Design, Memory)

## Currently working on

- File: —
- Task: Phase 1 — auth screens + API client wiring to NestJS backend
- Blocker: backend API not yet implemented

## Decisions

- Backend is NestJS + PostgreSQL via Supabase — all API calls target `/api/v1`
- Recharts (not Chart.js) for charts — already installed
- Mock data in `src/data/` is temporary; replace with API calls per phase
- Design tokens follow `docs/frontend/Design.md` — indigo primary, 4px grid

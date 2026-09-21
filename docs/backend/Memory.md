# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + PostgreSQL/Supabase + Prisma) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)

## Currently working on

- File: —
- Task: Phase 1 — NestJS scaffold, Prisma schema, school registration + OTP, JWT auth
- Blocker: none

## Decisions

- Stack locked: NestJS + Prisma + Supabase PostgreSQL (replacing original MERN plan)
- Money stored as integer paise; dates ISO-8601; UUIDs for all IDs
- Multi-tenant via `schoolId` on every table + tenant guard — do not add unscoped queries
- API contract defined in `docs/backend/Design.md` — follow envelopes exactly
- Recharts on frontend (not Chart.js) — chart endpoints should return plain series data

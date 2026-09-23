# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + Supabase/PostgreSQL) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Stack dependencies updated in `backend/package.json`: removed Prisma/Razorpay/Nodemailer; added Supabase, Stripe, SSLCommerz, Resend. Docs refreshed to match.
- 2026-09-23 — Added `docs/backend/Database.md` — the feature-wise ERD derived from PRD §3/§4. Restructured table-by-table: a feature-level ERD per PRD feature module, then one section per table (heading + metadata tag + full column spec + constraints + its own ERD) for all 33 tables, plus enums, indexes, transaction boundaries, a table inventory and PRD→table coverage. 43 mermaid diagrams in total. Records the identifier decision and flags 12 gaps for review (§16). Linked from `AGENTS.md` and `backend/README.md`. No migrations exist yet — every table is a design target.

## Currently working on

- File: —
- Task: Phase 1 — NestJS scaffold, Supabase client module + base schema migration, school registration + OTP, JWT auth
- Blocker: none

## Decisions

- Stack locked: NestJS + Supabase (PostgreSQL) (replacing original MERN/Prisma plan)
- Payments: Stripe (international) + SSLCommerz (Bangladesh) — Razorpay removed
- Email: Resend (transactional API) — Nodemailer/SMTP removed
- Money stored as integer paise; dates ISO-8601; UUIDs for all IDs
- Multi-tenant via `schoolId` on every table + tenant guard — do not add unscoped queries
- API contract defined in `docs/backend/Design.md` — follow envelopes exactly
- Recharts on frontend (not Chart.js) — chart endpoints should return plain series data
- DB identifiers are `snake_case` (Postgres/Supabase idiom, no quoted identifiers in raw SQL); services map them to the camelCase JSON required by `Design.md`. The PascalCase/camelCase names in PRD §3 are logical model names, not table names — see `docs/backend/Database.md` §1.
- ERD reference: `docs/backend/Database.md` is the schema source of truth alongside `supabase/migrations/` — change both together.

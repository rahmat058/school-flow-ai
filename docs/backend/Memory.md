# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + Supabase/PostgreSQL) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Stack dependencies updated in `backend/package.json`: removed Prisma/Razorpay/Nodemailer; added Supabase, Stripe, SSLCommerz, Resend. Docs refreshed to match.
- 2026-09-23 — Added `docs/backend/Database.md` — the feature-wise ERD derived from PRD §3/§4. Table-by-table: a feature-level ERD per PRD feature module, then one section per table (heading + metadata tag + full column spec + **Keys** + **Indexes** + **Constraints** + its own ERD) for all 33 tables. Keys carry PK/UK and every FK with its `on delete` action; §13 is a consolidated Foreign Key Map (86 FKs) and §14 the Index Plan (every index, incl. the mandatory `school_id` index per tenant table). Also enums, transaction boundaries, a table inventory, PRD→table coverage, and 13 open questions (§18). 43 mermaid diagrams total. §19 adds a **full-schema ERD** — one themed diagram (§19) containing all 33 tables, all 86 FK edges and the 2 logical links, themed to Design.md tokens via a mermaid `%%{init}%%` directive. Linked from `AGENTS.md` and `backend/README.md`. No migrations exist yet — every table is a design target.

- 2026-09-23 — **PRD §4 rewritten as endpoint checklists, Phases expanded to match.** Every feature module now lists its endpoints as individual `- [ ]` items carrying method, path, purpose and the guard/role scope, ordered create → read → aggregates so they can be built one at a time; the pre-existing **Behavior** blocks are untouched. 136 endpoint items across the 15 modules, replacing the grouped `CRUD …` / `A / B` bullets that could not be ticked individually. Fixed along the way: `GET /api/v1/:role` became explicit `/teachers`, `/students`, `/parents` (which is what the frontend actually calls); `GET /schools/current`, `GET /fees/invoices` and `GET /fees/summary` were **added** because the frontend already consumes them but the PRD never defined them; §4.14's "Chart.js-ready" corrected to Recharts-ready (it contradicted the Recharts decision); Timetables (§4.8) added to Phase 2, where it previously had no phase line at all. `Phases.md` now cites the PRD sections per phase and carries the granular items, with a note on why OTP registration must stay in Phase 1. **Open question:** the full contract is 136 endpoints against the frontend's 24 mocked ones — the frontend phases need re-sequencing as the backend lands.

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

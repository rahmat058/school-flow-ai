# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + Supabase/PostgreSQL) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Stack dependencies updated in `backend/package.json`: removed Prisma/Razorpay/Nodemailer; added Supabase, Stripe, SSLCommerz, Resend. Docs refreshed to match.
- 2026-09-23 — Added `docs/backend/Database.md` — the feature-wise ERD derived from PRD §3/§4. Table-by-table: a feature-level ERD per PRD feature module, then one section per table (heading + metadata tag + full column spec + **Keys** + **Indexes** + **Constraints** + its own ERD) for all 33 tables. Keys carry PK/UK and every FK with its `on delete` action; §13 is a consolidated Foreign Key Map (86 FKs) and §14 the Index Plan (every index, incl. the mandatory `school_id` index per tenant table). Also enums, transaction boundaries, a table inventory, PRD→table coverage, and 13 open questions (§18). 43 mermaid diagrams total. §19 adds a **full-schema ERD** — one themed diagram (§19) containing all 33 tables, all 86 FK edges and the 2 logical links, themed to Design.md tokens via a mermaid `%%{init}%%` directive. Linked from `AGENTS.md` and `backend/README.md`. No migrations exist yet — every table is a design target.

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

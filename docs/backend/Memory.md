# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + Supabase/PostgreSQL) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Stack dependencies updated in `backend/package.json`: removed Prisma/Razorpay/Nodemailer; added Supabase, Stripe, SSLCommerz, Resend. Docs refreshed to match.
- 2026-09-23 — Added `docs/backend/Database.md` — the feature-wise ERD derived from PRD §3/§4. Table-by-table: a feature-level ERD per PRD feature module, then one section per table (heading + metadata tag + full column spec + **Keys** + **Indexes** + **Constraints** + its own ERD) for all 33 tables. Keys carry PK/UK and every FK with its `on delete` action; §13 is a consolidated Foreign Key Map (86 FKs) and §14 the Index Plan (every index, incl. the mandatory `school_id` index per tenant table). Also enums, transaction boundaries, a table inventory, PRD→table coverage, and 13 open questions (§18). 43 mermaid diagrams total. §19 adds a **full-schema ERD** — one themed diagram (§19) containing all 33 tables, all 86 FK edges and the 2 logical links, themed to Design.md tokens via a mermaid `%%{init}%%` directive. Linked from `AGENTS.md` and `backend/README.md`. No migrations exist yet — every table is a design target.

- 2026-09-23 — **PRD §4 rewritten as endpoint checklists, Phases expanded to match.** Every feature module now lists its endpoints as individual `- [ ]` items carrying method, path, purpose and the guard/role scope, ordered create → read → aggregates so they can be built one at a time; the pre-existing **Behavior** blocks are untouched. 136 endpoint items across the 15 modules, replacing the grouped `CRUD …` / `A / B` bullets that could not be ticked individually. Fixed along the way: `GET /api/v1/:role` became explicit `/teachers`, `/students`, `/parents` (which is what the frontend actually calls); `GET /schools/current`, `GET /fees/invoices` and `GET /fees/summary` were **added** because the frontend already consumes them but the PRD never defined them; §4.14's "Chart.js-ready" corrected to Recharts-ready (it contradicted the Recharts decision); Timetables (§4.8) gained an explicit post-MVP note, since no phase claimed it. `Phases.md` now cites the PRD sections per phase and carries the granular items, with a note on why OTP registration must stay in Phase 1. **Open question:** the full contract is 136 endpoints against the frontend's 24 mocked ones — the frontend phases need re-sequencing as the backend lands.
- 2026-09-23 — **Feature-wise endpoint audit** against `Database.md` (33 tables → module → phase) and the §2 role matrix. All 13 declared modules map to a §4 section, so nothing is orphaned. Fixes: the AI assistant is **7** features, not 8 — the `ai_feature` enum and the frontend's `AiFeature` type both list 7, so §1.1, `Architecture.md` and `Phases.md` were corrected (§9 was already right, and `Database.md` §18 open question 8 is now marked resolved); §2's AI row claimed Teacher ✅ generically while §4.12 scopes features per endpoint, so the matrix now names what each role actually gets; gaps filled — `GET /parents/:id/students` plus a parent's access to `GET /students/:id` (the `parent_students` table had no read path), `attendance:marked` promoted from Behavior to a checklist item, and §4.16 for `GET /health`, the one endpoint with no feature module; role markers realigned to §2 for exam create/publish and fee `create-order`. **Correction to my previous entry:** I added timetables to Phase 2, but `Database.md` tags those tables `phase: none` and the frontend phases call the builder post-MVP — they are now marked post-MVP in both `Phases.md` and §4.8, and `Database.md` §18 question 4 is marked resolved. 139 endpoint items now.
- 2026-09-23 — **PRD §4 synced to the `Database.md` schema, and update verbs corrected.** Every feature section now opens with a `**Tables:**` line naming the tables it owns (taken from `Database.md` §17 and the per-table `module:` tags), so an endpoint can be traced to its schema in one hop and the two documents can be diffed against each other. Method guidance: **`PATCH` for partial updates is now the default** — 13 update routes converted from `PUT`, since a settings/profile/edit body only ever carries the changed fields. The single remaining `PUT` is deliberate and documented: `PUT /timetables/:id` replaces the whole `periods` set, which is what `PUT` is for. The rule is written into `PRD.md` §5 (Methods) and `Design.md` (URL conventions) so it is contract, not preference. `frontend/src/services/apiClient.ts` gained a matching `patch()` helper — it only had `put()`, so the contract and the client had diverged before any update form was written.

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

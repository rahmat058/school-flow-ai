# Memory — Backend

## Completed

- 2026-09-21 — Backend PRD written (NestJS + Supabase/PostgreSQL) in `docs/backend/PRD.md`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Stack dependencies updated in `backend/package.json`: removed Prisma/Razorpay/Nodemailer; added Supabase, Stripe, SSLCommerz, Resend. Docs refreshed to match.

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

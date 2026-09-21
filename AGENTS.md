# AGENTS.md — School Flow AI

Multi-role School Management System: **Admin, Teacher, Student, Parent** dashboards with attendance, fees, homework, exams, AI assistant, real-time chat, and reports.

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Recharts (`frontend/`)
- **Backend:** NestJS + Prisma + PostgreSQL (Supabase) (`backend/`)

## Read before any work

Every session starts by reading the docs for the side you're touching. These files are the source of truth — follow them exactly.

| File                                                             | Purpose                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| `docs/frontend/PRD.md` / `docs/backend/PRD.md`                   | **What** to build and for whom                     |
| `docs/frontend/Architecture.md` / `docs/backend/Architecture.md` | **How** it's structured (folders, flow, stack)     |
| `docs/frontend/Rules.md` / `docs/backend/Rules.md`               | **Constraints** — what to use, what to avoid       |
| `docs/frontend/Phases.md` / `docs/backend/Phases.md`             | **Delivery order** — one phase at a time           |
| `docs/frontend/Design.md` / `docs/backend/Design.md`             | **Visual language** (UI tokens / API contract)     |
| `docs/frontend/Memory.md` / `docs/backend/Memory.md`             | **Session state** — done, in-progress, decisions   |
| `docs/CODE_REVIEWER.md`                                          | Review checklist — apply before finishing any task |

## Core rules

1. **Scope:** touch only the files needed for the current task; never refactor unrelated code.
2. **Phases:** complete the current phase in `Phases.md` before starting the next.
3. **Dependencies:** never install packages without explicit approval.
4. **Commits:** never commit unless asked.
5. **Conventions:** match existing patterns before introducing new ones; smallest correct diff wins.
6. **Validation:** run lint + typecheck (frontend) / lint + build (backend) before finishing.
7. **Memory:** update the relevant `Memory.md` at the end of each session — completed work, active file, decisions made.

## Cross-side contract

- All frontend API calls target `/api/v1` per `docs/backend/Design.md` (envelopes, naming, money in paise).
- Backend exposes only what the frontend phases need; keep both `Phases.md` files aligned when scope changes.
- When a decision affects both sides, record it in **both** `Memory.md` files.

## Quick commands

```bash
# frontend
cd frontend && npm run dev        # dev server
npm run lint && npm run typecheck # validate

# backend
cd backend && npm install && npx prisma migrate dev
npm run start:dev                 # dev server
```

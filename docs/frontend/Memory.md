# Memory — Frontend

## Completed

- 2026-09-21 — Project scaffold: Vite + React 19 + TS + Tailwind 4, dashboard shell components (AppShell, Header, Sidebar, StatCard, StatGrid, RevenueChart, TransactionsTable, InsightsCard) with mock data in `src/data/dashboard.ts`
- 2026-09-21 — Docs scaffolded per vibe-coding structure (PRD, Architecture, Rules, Phases, Design, Memory)
- 2026-09-23 — Added frontend dependencies: zustand, framer-motion, date-fns, @react-pdf/renderer. Docs (Architecture tech stack, Memory decisions) updated to record them.
- 2026-09-23 — Adopted TanStack Query 5 (`@tanstack/react-query`) for all server state. Docs updated: Architecture (tech stack + data layer), Rules (Use/Avoid), CODE_REVIEWER (frontend checklist), this file. Not yet wired in `src/` — `QueryClientProvider` and the first query hooks land with the Phase 1 API client.
- 2026-09-23 — Added `motion` v13 for animations; docs updated (Architecture tech stack, Rules). Not yet used in `src/`. `framer-motion` remains a direct dependency but is redundant — `motion` depends on it, and `framer-motion` 13.4.x is the same library under its legacy name.
- 2026-09-23 — Built the design-system primitives in `src/components/ui/`: Input, Textarea, Select, Checkbox, Radio, Switch, Card, Modal + ConfirmDialog, Tabs, Table, DataTable, Pagination, Dropdown, Tooltip, Alert, Progress, Avatar, Skeleton, Spinner, EmptyState, Accordion. Raw HTML + Tailwind + `motion` only — no new packages. `Button` gained the `destructive` variant from Design.md; added `src/hooks/useControllableState.ts` and `MotionConfig reducedMotion="user"` in `main.tsx`. Not yet consumed by any page.
- 2026-09-23 — Fixed the TypeScript 6 config and unblocked `npm run build`: removed the deprecated `baseUrl` from `tsconfig.app.json` and made the mapping relative (`"@/*": ["./src/*"]`), which is what TS 6 requires once `baseUrl` is gone. `tsc -b && vite build` passes again (Vercel deploys were failing). That also exposed two real type errors that had been invisible — `HTMLHeadingElement` wrongly imported from `react` in `Card.tsx` (it is a DOM global) and a callback-variance mismatch in `Radio.tsx` — both fixed.
- 2026-09-23 — Root cause of the above: `npm run typecheck` ran `tsc --noEmit` against the solution-style root `tsconfig.json` (`"files": []`), which compiled **zero files**. Changed the script to `tsc -b` so it typechecks both referenced projects. Any earlier "typecheck clean" result was meaningless. Verified with `tsc -b -v` (builds `tsconfig.app.json` + `tsconfig.node.json`) and no files are emitted (`noEmit: true`).

**Known issue (not fixed):** `vite.config.ts` uses `__dirname`, which the planned Vite `configLoader: 'native'` rejects — the build warns to use `import.meta.dirname`. Warning only today; will break on a future Vite major.

## Currently working on

- File: —
- Task: Phase 1 — auth screens + API client wiring to NestJS backend
- Blocker: backend API not yet implemented

## Decisions

- Backend is NestJS + PostgreSQL via Supabase — all API calls target `/api/v1`
- Recharts (not Chart.js) for charts — already installed
- State: Zustand for client-only global state (auth/session, school context) — no Redux
- Server state: TanStack Query 5 for all `/api/v1` data — query/mutation hooks in feature `api.ts` with cache + invalidation; never cache API responses in Zustand
- Animations: `motion` v13 for UI transitions — React APIs imported from `motion/react`; `framer-motion` is the legacy package name for the same library and must not be imported directly
- Dates: date-fns for formatting and academic-calendar helpers
- Reports: @react-pdf/renderer for PDF export (report cards, invoices)
- Mock data in `src/data/` is temporary; replace with API calls per phase
- Design tokens follow `docs/frontend/Design.md` — indigo primary, 4px grid
- UI primitives are hand-rolled from raw HTML + Tailwind in `src/components/ui/` — no component library (no Radix/Headless UI/shadcn). `motion` (`motion/react`) provides all animation, and `MotionConfig reducedMotion="user"` in `main.tsx` makes it respect OS reduced-motion settings.

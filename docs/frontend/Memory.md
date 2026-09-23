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
- 2026-09-23 — Added `Toast` to `src/components/ui/` with `success` / `warning` / `error` / `info` tones (reusing the Alert palette: `bg-*-soft` + `border-*/20`), plus `ToastProvider` + `useToast`. The hook lives in `src/hooks/useToast.ts` rather than beside the component, because `react-refresh/only-export-components` rejects a file that exports both components and hooks — this keeps the documented `hooks/` convention. Provider is mounted in `main.tsx` **inside** `MotionConfig` so toasts respect reduced-motion. Motion: spring entry, `layout` reflow when one is dismissed, slide-and-fade exit through `AnimatePresence`; hovering a toast pauses its auto-dismiss (`duration: 0` makes it sticky). Accessibility: the region is always mounted (so the live region exists before content arrives) with `role="alert"` for error/warning and `role="status"` otherwise. Verified: `tsc -b`, eslint, a 9-case SSR smoke test (all four tones, provider mount, empty initial queue, context shape, `useToast` throwing outside a provider) and a built-CSS check that every utility compiles. **Not** verified automatically: auto-dismiss timing, hover-pause, exit animation and stacking — no DOM test environment is installed (no jsdom/happy-dom) and adding one needs approval.
- 2026-09-23 — Implemented **Phase 1** (auth, routing, API layer) and a list-page showcase: axios client (`src/services/apiClient.ts`) with JWT attach, envelope unwrapping and a normalised `ApiError`; mock adapter (`src/services/mockAdapter.ts`) serving every endpoint from `src/data/`; Zustand auth session with refresh-cookie bootstrap (`src/store/auth.ts`); public/private route groups with `ProtectedRoute`, `PublicOnlyRoute` and `RoleGuard`; login, school signup, OTP verification, forgot-password and reset-password screens; role-aware sidebar/header; and a school-data dashboard plus Students, Invoices and Notices list pages on TanStack Query. 19 demo data files mirror `docs/backend/Database.md`; the "Curator Pro" template data and its three dashboard components were replaced.

**Known issue (not fixed):** `vite.config.ts` uses `__dirname`, which the planned Vite `configLoader: 'native'` rejects — the build warns to use `import.meta.dirname`. Warning only today; will break on a future Vite major.

## Currently working on

- File: `src/routes/privateRoutes.tsx` · next: `src/pages/admin/StudentsPage.tsx`
- Task: Phase 2 — Admin core (students/teachers/parents management against the live API)
- Blocker: backend API not yet implemented — the frontend runs entirely on the mock adapter

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
- Auth session lives in a **Zustand** store (`src/store/auth.ts`) — access token in memory only, restored on reload via `POST /auth/refresh`. `Architecture.md`'s old `context/` entry was replaced by `store/`.
- Demo data is served **through** axios via a custom adapter, not around it: hooks, interceptors, JWT attach and error envelopes are exercised exactly as they will be against the backend. `VITE_ENABLE_MOCKS=false` switches to the real API with no other change.
- Route structure: `src/routes/paths.ts` is the single source of route strings; `publicRoutes.tsx` / `privateRoutes.tsx` are plain `RouteObject[]` composed by `AppRoutes`; pages are `React.lazy` so each ships as its own chunk.
- Guard _decisions_ are pure functions in `routes/guards/guardDecision.ts` (testable without a DOM — React Router's `<Navigate>` is a no-op on a static render, and zustand v5 serves its initial state to server renders).
- Demo logins: `admin@` / teacher / student / parent accounts at `brightfuture.edu`, password `demo1234`; the signup OTP is `123456`. Both are shown on the login screen while mocks are on.
- **Debt:** no DOM test runner is installed, so interaction (submit, redirect, pagination clicks) is unverified by automation. Verification to date: `tsc -b`, eslint, prettier, `vite build`, plus Node smoke tests over the axios/mock layer (11 cases) and the guard decisions and auth-page rendering (13 cases).

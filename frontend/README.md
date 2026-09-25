# School Flow AI — Frontend

React 19 + Vite + TypeScript + Tailwind CSS 4 client for School Flow AI — the
Admin, Teacher, Student, and Parent dashboards that consume the backend API at
`/api/v1`.

Part of the [school-flow-ai](../README.md) monorepo. The frontend docs in
[`../docs/frontend/`](../docs/frontend) are the source of truth.

---

## Quick start

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on Vite's default port. Point it at a running backend (see
[`../backend/README.md`](../backend/README.md)); all requests target `/api/v1`.

Validate before finishing any task:

```bash
npm run lint && npm run typecheck
```

---

## Folder structure

```text
frontend/
├── public/                   # static assets
├── src/
│   ├── main.tsx              # app bootstrap, router, providers
│   ├── App.tsx               # route definitions + role-based guards
│   ├── pages/                # route-level screens, grouped by role
│   │   ├── admin/
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   ├── components/           # presentational, grouped by the screen it serves
│   │   ├── dashboard/        # the dashboard's role halves + the pieces they share
│   │   │   ├── admin/        # OverviewHeader, charts, AdminDashboard
│   │   │   ├── student/      # StudentDashboard + its cards
│   │   │   └── common/       # StatCard, StatGrid, UpcomingExamsCard, iconTone
│   │   ├── layout/           # AppShell, Header, Sidebar
│   │   └── ui/               # design-system primitives (Button, Badge, Input, Modal)
│   ├── features/             # attendance/, fees/, homework/, exams/, chat/ …
│   │                         # each owns its components + hooks + api.ts
│   ├── services/             # api client (fetch wrapper), socket client
│   ├── hooks/                # useAuth, useSocket, shared hooks
│   ├── context/              # AuthContext, SchoolContext
│   ├── lib/                  # cn(), formatters, constants
│   ├── data/                 # static/mock data during development
│   ├── types/                # shared types mirroring API DTOs
│   └── styles/               # index.css — Tailwind 4 @theme tokens
├── index.html
├── vite.config.ts            # react + tailwind plugins, '@' → ./src alias
├── tsconfig.json             # project refs → tsconfig.app.json / tsconfig.node.json
└── eslint.config.js
```

### Where new code goes

| You are adding…                   | Put it in…                                       |
| --------------------------------- | ------------------------------------------------ |
| A route screen                    | `src/pages/<role>/`                              |
| A reusable UI primitive           | `src/components/ui/`                             |
| Shell/layout chrome               | `src/components/layout/`                         |
| A dashboard piece one role uses   | `src/components/dashboard/<role>/`               |
| A dashboard piece shared by roles | `src/components/dashboard/common/`               |
| A feature (attendance, fees)      | `src/features/<name>/` + page in `pages/<role>/` |
| Data fetching for a feature       | `src/features/<name>/api.ts` via `services/`     |
| Shared hook / auth state          | `src/hooks/` / `src/context/`                    |
| A shared type                     | `src/types/`                                     |

**Naming:** components in `PascalCase.tsx`, hooks `useThing.ts`, API modules
`feature.api.ts`. Prefer the `@/` alias over deep relative paths.

---

## Stack

- [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/) — UI and role-based routing
- [Vite](https://vitejs.dev/) — dev server and build
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Tailwind CSS 4](https://tailwindcss.com/) — styling; theme tokens live in CSS (`styles/index.css`), not arbitrary hex values
- [Recharts](https://recharts.org/) — dashboard and report charts
- [lucide-react](https://lucide.dev/) — icons

`socket.io-client` is added with the chat phase.

---

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Vite dev server                     |
| `npm run build`     | Typecheck + production build        |
| `npm run preview`   | Preview the production build        |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm run lint`      | ESLint (`lint:fix` to fix)          |
| `npm run format`    | Prettier (`format:check` to verify) |

---

## Conventions

- Follow the folder rules above and the patterns already in the codebase before
  introducing new ones — smallest correct diff wins.
- Use design tokens (`text-ink`, `bg-surface`, …) and the `ui/` primitives
  instead of raw hex colors and bare `<button>` elements.
- Routes are declarative in `App.tsx` under an `<AppShell />` layout route with
  role guards; keep shell concerns out of pages.
- Auth state and session live in React context; tokens stay in memory plus an
  httpOnly refresh cookie.
- Keep code and docs in sync — see the docs table below.

---

## Docs

| File                                                                   | Purpose                    |
| ---------------------------------------------------------------------- | -------------------------- |
| [`../docs/frontend/PRD.md`](../docs/frontend/PRD.md)                   | What to build and for whom |
| [`../docs/frontend/Architecture.md`](../docs/frontend/Architecture.md) | Structure, flow, stack     |
| [`../docs/frontend/Rules.md`](../docs/frontend/Rules.md)               | Constraints — use / avoid  |
| [`../docs/frontend/Phases.md`](../docs/frontend/Phases.md)             | Delivery order             |
| [`../docs/frontend/Design.md`](../docs/frontend/Design.md)             | Visual language and tokens |
| [`../docs/frontend/Memory.md`](../docs/frontend/Memory.md)             | Session state              |

Full repo workflow: [`../AGENTS.md`](../AGENTS.md). API contract:
[`../docs/backend/Design.md`](../docs/backend/Design.md).

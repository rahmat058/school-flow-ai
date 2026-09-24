# Architecture — Frontend

## App flow

Login (JWT) → role-based redirect → role dashboard shell (AppShell + Sidebar + Header) → feature pages calling `api/v1` REST endpoints → Socket.io channel for chat/notifications alongside REST.

Layers: **Pages → Components → API client (services) → Backend API**. The auth session lives in a Zustand store (`src/store/auth.ts`): the access token is held in memory only and re-acquired from the httpOnly refresh cookie on reload. **TanStack Query** owns all server state — feature `api.ts` modules expose `useQuery`/`useMutation` hooks, and components never call the API client directly. In development the axios client is wired to a mock adapter (`src/services/mockAdapter.ts`) that answers from `src/data/`, so the request path is identical to production; set `VITE_ENABLE_MOCKS=false` to talk to a real backend.

## Folder structure

```
frontend/
├── src/
│   ├── main.tsx              # App bootstrap + providers (MotionConfig, QueryClient, ToastProvider)
│   ├── App.tsx               # Router entry (BrowserRouter → AppRoutes)
│   ├── routes/               # route table + guards
│   │   ├── paths.ts          # every route string (single source of truth)
│   │   ├── AppRoutes.tsx     # composes public + private groups, lazy pages, Suspense
│   │   ├── publicRoutes.tsx  # login, signup, OTP verification, forgot/reset
│   │   ├── privateRoutes.tsx # AppShell + role-guarded module pages
│   │   ├── lazyPages.ts      # React.lazy page components (code splitting)
│   │   ├── RouteFallback.tsx # loading boundary
│   │   └── guards/           # ProtectedRoute, PublicOnlyRoute, RoleGuard, guardDecision
│   ├── pages/                # Route-level screens
│   │   ├── auth/             # Login, Signup, VerifyOtp, ForgotPassword, ResetPassword
│   │   ├── admin/            # Students, StudentProfile, Teachers, Fees, FeeCollect
│   │   └── …                 # teacher/, student/, parent/ as those phases land
│   ├── components/
│   │   ├── layout/           # AppShell, Header, Sidebar
│   │   ├── dashboard/        # StatGrid, StatCard, CollectionChart, RecentPaymentsTable, AiInsightsCard, OverviewHeader
│   │   └── ui/               # design-system primitives (Input, Select, Card, Modal, Tabs, Table, DataTable, Toast, …)
│   ├── features/             # auth/, dashboard/, students/, teachers/, classes/, subjects/, notices/, chat/, permissions/, fees/, homework/, timetable/, school/
│   │                         # each: components/ (+ hooks/, lib/ where a domain needs them) and query hooks in api.ts
│   ├── services/             # apiClient.ts (axios + interceptors), mockAdapter.ts (demo API)
│   ├── store/                # Zustand stores — auth session
│   ├── hooks/                # useControllableState, useToast
│   ├── lib/                  # cn(), env, format, queryClient, navigation, brand
│   ├── data/                 # demo data — one file per domain, mirrors docs/backend/Database.md
│   ├── types/                # shared TypeScript types mirroring API DTOs
│   └── styles/               # index.css (Tailwind 4 theme tokens)
├── .env.example
├── index.html
└── vite.config.ts
```

**Naming:** components in `PascalCase.tsx`, hooks `useThing.ts`, API modules `feature.api.ts`. New features live under `src/features/<name>/` with their page wrapper in `src/pages/<role>/`. Route strings come from `src/routes/paths.ts`, nav items from `src/lib/navigation.ts`, and environment values from `src/lib/env.ts` — never inline path or `import.meta.env` strings.

## Tech stack

- **Vite 8** — dev server + build
- **React 19 + TypeScript** — UI
- **React Router 7** — routing with public/private groups and role-based route guards
- **axios** — HTTP client behind `src/services/apiClient.ts`; attaches the JWT, unwraps the response envelope and normalises failures into `ApiError`
- **Tailwind CSS 4** (`@tailwindcss/vite`) — styling, theme tokens in CSS
- **Zustand** — client-only global state (auth/session, school context) — no Redux
- **TanStack Query 5** (`@tanstack/react-query`) — server state: query/mutation hooks, caching, and invalidation for all `/api/v1` data
- **react-hook-form** — form state and validation; `register()` binds the native inputs (they accept a `ref`), `Controller` covers the non-native primitives
- **motion** (v13, successor to `framer-motion`) — UI animations and transitions; import React APIs from `motion/react`
- **date-fns** — date formatting and academic-calendar helpers
- **@react-pdf/renderer** — PDF report cards / invoices from shared data
- **Recharts** — dashboard/report charts
- **react-day-picker** (v10) — the dashboard's month calendar; themed through its CSS variables from `src/styles/index.css`, never by overriding its classes (see `Rules.md`)
- **lucide-react** — icons
- **Socket.io-client** — real-time chat & notifications (to add with chat phase)
- Deployed on **Vercel**

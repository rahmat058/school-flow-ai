# Architecture — Frontend

## App flow

Login (JWT) → role-based redirect → role dashboard shell (AppShell + Sidebar + Header) → feature pages calling `api/v1` REST endpoints → Socket.io channel for chat/notifications alongside REST.

Layers: **Pages → Components → API client (services) → Backend API**. Auth state and session live in a React context; tokens stored in memory + httpOnly refresh cookie.

## Folder structure

```
frontend/
├── src/
│   ├── main.tsx              # App bootstrap, router, providers
│   ├── App.tsx               # Route definitions + guards
│   ├── pages/                # Route-level screens (DashboardPage, …)
│   │   ├── admin/            # Admin feature pages
│   │   ├── teacher/
│   │   ├── student/
│   │   └── parent/
│   ├── components/
│   │   ├── layout/           # AppShell, Header, Sidebar
│   │   ├── dashboard/        # StatCard, StatGrid, RevenueChart, …
│   │   └── ui/               # Button, Badge, Input, Modal (design-system primitives)
│   ├── features/             # attendance/, fees/, homework/, exams/, chat/ …
│   │                         # each: components + hooks + api.ts
│   ├── services/             # api client (fetch wrapper), socket client
│   ├── hooks/                # useAuth, useSocket, shared hooks
│   ├── context/              # AuthContext, SchoolContext
│   ├── lib/                  # cn(), formatters, constants
│   ├── data/                 # static/mock data during development
│   ├── types/                # shared TypeScript types mirroring API DTOs
│   └── styles/               # index.css (Tailwind 4 theme tokens)
├── index.html
└── vite.config.ts
```

**Naming:** components in `PascalCase.tsx`, hooks `useThing.ts`, API modules `feature.api.ts`. New features live under `src/features/<name>/` with their page wrapper in `src/pages/<role>/`.

## Tech stack

- **Vite 7** — dev server + build
- **React 19 + TypeScript** — UI
- **React Router 7** — routing with role-based route guards
- **Tailwind CSS 4** (`@tailwindcss/vite`) — styling, theme tokens in CSS
- **Recharts** — dashboard/report charts
- **lucide-react** — icons
- **Socket.io-client** — real-time chat & notifications (to add with chat phase)
- Deployed on **Vercel**

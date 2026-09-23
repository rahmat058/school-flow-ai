# School Flow AI

Multi-role **School Management System** — Admin, Teacher, Student, and Parent dashboards with attendance, fees, homework, exams, an AI assistant, real-time chat, and reports.

<div>
<img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/TypeScript_5+-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
<img src="https://img.shields.io/badge/NestJS_12-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">
<img src="https://img.shields.io/badge/Prisma_7-2D3748?style=for-the-badge&logo=prisma&logoColor=white">
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge">
</div>

Monorepo with a React frontend (`frontend/`) and a NestJS + Prisma + PostgreSQL (Supabase) backend (`backend/`). Product plans, architecture, rules, and delivery phases live in **[docs/](./docs)** — those files are the source of truth. Agents and maintainers start with **[AGENTS.md](./AGENTS.md)**.

---

## 🚀 Quick Start

### Prerequisites

| Requirement    | Notes                                                                |
| -------------- | -------------------------------------------------------------------- |
| **Node.js**    | 20+ (npm)                                                            |
| **PostgreSQL** | Supabase project (pooler URL for runtime, direct URL for migrations) |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Validate before finishing work:

```bash
npm run lint && npm run typecheck
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, etc.
npx prisma migrate dev
npm run start:dev
```

Validate before finishing work:

```bash
npm run lint && npm run build
```

The frontend calls the backend at `/api/v1` per [docs/backend/Design.md](./docs/backend/Design.md) (response envelopes, naming, money in paise).

---

## 📁 Project structure

```text
school-flow-ai/
├── frontend/                    # React 19 + Vite + TypeScript + Tailwind CSS 4
│   └── src/
│       ├── main.tsx             # App bootstrap, router, providers
│       ├── App.tsx              # Route definitions + role guards
│       ├── pages/               # Route-level screens per role (admin/, teacher/, …)
│       ├── components/          # layout/, dashboard/, ui/ primitives
│       ├── features/            # attendance/, fees/, homework/, exams/, chat/ …
│       ├── services/            # API client + socket client
│       ├── hooks/, context/     # useAuth, AuthContext, SchoolContext
│       ├── lib/, data/, types/, styles/
├── backend/                     # NestJS 12 + Prisma + PostgreSQL
│   ├── prisma/schema.prisma     # Single source of truth for the DB
│   └── src/
│       ├── main.ts              # Prefix /api/v1, pipes, filters, helmet, CORS
│       ├── prisma/              # PrismaModule + PrismaService (global)
│       ├── common/              # guards, decorators, filters, interceptors
│       └── <feature modules>    # auth, schools, users, classes, attendance,
│                                # fees, homework, exams, chat, notices, ai, …
├── docs/                        # PRD, Architecture, Rules, Phases, Design, Memory
├── scripts/                     # commit tooling (Commitizen emoji prompt)
└── AGENTS.md                    # How agents and contributors work in this repo
```

Deep dive: **[docs/frontend/Architecture.md](./docs/frontend/Architecture.md)** · **[docs/backend/Architecture.md](./docs/backend/Architecture.md)** · Review checklist: **[docs/CODE_REVIEWER.md](./docs/CODE_REVIEWER.md)**

Per-side guides: **[frontend/README.md](./frontend/README.md)** · **[backend/README.md](./backend/README.md)**

---

## ⚡ Built with

- [React 19](https://react.dev/) + [React Router 7](https://reactrouter.com/) — UI and routing with role-based guards
- [Vite](https://vitejs.dev/) + [Tailwind CSS 4](https://tailwindcss.com/) — build tooling and design tokens
- [Recharts](https://recharts.org/) — dashboard and report charts
- [NestJS 12](https://nestjs.com/) — modular backend with dependency injection
- [Prisma](https://www.prisma.io/) + [PostgreSQL (Supabase)](https://supabase.com/) — ORM and database
- [Passport.js + JWT](https://www.passportjs.org/) — access (15m) + refresh (7d) auth
- [Socket.io](https://socket.io/) — real-time chat and notifications
- [BullMQ + Redis](https://docs.bullmq.io/) — email and notification queues
- [ESLint](https://eslint.org/) · [Prettier](https://prettier.io/) · [Husky](https://typicode.github.io/husky/) · [Commitlint](https://commitlint.js.org/)

---

## 🛠️ Scripts

### Root

| Command                     | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm run commit`            | Commitizen prompt (emoji + conventional header) |
| `npm run lint` / `lint:fix` | ESLint (frontend)                               |
| `npm run format`            | Prettier (frontend)                             |

### Frontend (`cd frontend`)

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Vite dev server              |
| `npm run build`     | Typecheck + production build |
| `npm run typecheck` | `tsc --noEmit`               |
| `npm run lint`      | ESLint                       |

### Backend (`cd backend`)

| Command             | Description             |
| ------------------- | ----------------------- |
| `npm run start:dev` | Nest dev server (watch) |
| `npm run build`     | `nest build`            |
| `npm run lint`      | ESLint                  |
| `npm test`          | Jest                    |
| `npm run migrate`   | `prisma migrate dev`    |

---

## 📚 Docs as the source of truth

Every session starts by reading the docs for the side being touched:

| File                                                             | Purpose                                      |
| ---------------------------------------------------------------- | -------------------------------------------- |
| `docs/frontend/PRD.md` / `docs/backend/PRD.md`                   | What to build and for whom                   |
| `docs/frontend/Architecture.md` / `docs/backend/Architecture.md` | How it's structured                          |
| `docs/frontend/Rules.md` / `docs/backend/Rules.md`               | Constraints — what to use, what to avoid     |
| `docs/frontend/Phases.md` / `docs/backend/Phases.md`             | Delivery order — one phase at a time         |
| `docs/frontend/Design.md` / `docs/backend/Design.md`             | Visual language / API contract               |
| `docs/frontend/Memory.md` / `docs/backend/Memory.md`             | Session state — done, in-progress, decisions |

Finish the current phase before starting the next; keep both `Memory.md` files updated at the end of each session.

---

## 🤝 Contributing

Issues and pull requests are welcome. Please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** and the **[Code of Conduct](./CODE_OF_CONDUCT.md)** before opening a PR.

- [Security policy](./SECURITY.md)
- [AGENTS.md](./AGENTS.md) — repo workflow for agents and contributors

---

## 📄 License

Published under the [MIT](./LICENSE) license © 2026 [Kazi Rahamatullah](https://github.com/rahmat058).

---

## 👤 Made by

**[Kazi Rahamatullah](https://www.kazi-rahamatullah.com/)** ([@rahmat058](https://github.com/rahmat058)) — Frontend & JAMstack developer based in Dhaka, Bangladesh.

- [GitHub](https://github.com/rahmat058)
- [LinkedIn](https://www.linkedin.com/in/rahmat058/)
- [Website](https://www.kazi-rahamatullah.com/)

# School Flow AI — Backend

NestJS + PostgreSQL (TypeORM) API for School Flow AI — auth, schools,
users, and the attendance, fees, homework, exams, chat, notices, AI, and reports
modules that serve the frontend over `/api/v1`.

Part of the [school-flow-ai](../README.md) monorepo. The backend docs in
[`../docs/backend/`](../docs/backend) are the source of truth.

> **The mock adapter is the API of record until this backend overtakes it.** The frontend
> answers every request from `frontend/src/services/mockAdapter.ts` over the deterministic seed
> in `frontend/src/data/`, so that adapter's routes, payloads, guards and error codes are the
> contract these modules build to — where the mock and a doc disagree, the disagreement is a
> documentation bug ([`Database.md`](../docs/backend/Database.md)). Phase 1 is under way: `src/`
> holds the config, TypeORM (`database/`), mail and auth modules — school registration with email
> verification, login/refresh/logout and `GET /auth/me` — over the `schools`/`users` schema, which
> is applied by hand (see Quick start).

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, etc.
npm run start:dev
```

The schema is **not** ORM-managed. There are no migrations and `synchronize` is off, so the
entities in `src/database/entities/` only map onto the tables — create and change the schema by
hand in the Supabase SQL editor ([`Schema.md`](../docs/backend/Schema.md) is the per-table
reference). That keeps the ORM from ever reshaping a shared database.

Validate before finishing any task:

```bash
npm run lint && npm run build
```

---

## Folder structure

```text
backend/
├── src/
│   ├── main.ts               # bootstrap: /api/v1 prefix, pipes, filters, helmet, CORS
│   ├── app.module.ts
│   ├── database/             # TypeORM DataSource (global) + entities
│   │   ├── data-source-options.ts  # the one place the connection is declared
│   │   └── entities/               # *.entity.ts — the mapping onto the tables
│   ├── common/
│   │   ├── guards/           # jwt-auth, roles, permissions, tenant
│   │   ├── decorators/       # @Roles, @RequirePermission, @CurrentUser, @SchoolId
│   │   ├── filters/          # global exception filter
│   │   ├── interceptors/     # response envelope, logging
│   │   └── pipes/            # validation helpers
│   ├── auth/                 # strategies, guards, dto + the RBAC catalogue and per-user grants
│   ├── schools/              # registration, OTP, school profile + settings, backup
│   ├── users/                # teachers, students, parents
│   ├── classes/              # classes, the subject catalogue + class-subject assignments
│   ├── attendance/
│   ├── fees/                 # structures + heads, invoices, payments, receipts, reports, concessions
│   ├── homework/
│   ├── timetables/
│   ├── exams/                # exams, results, report cards
│   ├── chat/                 # gateway + conversations + messages
│   ├── notices/              # notices + events
│   ├── ai/                   # 7 AI features: quiz, homework help, event plan, notice, chat, report comment, fee reminder
│   ├── materials/            # study material uploads
│   ├── reports/              # analytics + CSV export
│   └── mail/                 # Resend mailer + react-email .tsx templates
├── test/                     # test/<module>/ e2e specs
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── .npmrc                    # legacy-peer-deps (TypeORM's optional ioredis ^5 peer vs ioredis 6)
├── .env                      # not committed
└── .env.example              # committed template — `cp .env.example .env`
```

Each feature module owns its routes under `/api/v1/<feature>` and follows the
same internal layout:

```text
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/                      # create-*.dto.ts / update-*.dto.ts
└── <feature>.gateway.ts      # only for real-time modules (chat)
```

---

## Stack

- [NestJS](https://nestjs.com/) — modular framework with dependency injection
- [TypeORM](https://typeorm.io/) + [`pg`](https://node-postgres.com/) — the data layer: entities in `src/database/entities/` map onto the tables and services inject `Repository<T>` classes. `synchronize` stays **off** and there are no migrations — the schema is applied by hand
- PostgreSQL hosted on [Supabase](https://supabase.com/), reached over the session-mode pooler
- [Passport.js + JWT](https://www.passportjs.org/) — access (7d) + refresh (7d) auth
- [Socket.io](https://socket.io/) — chat and notifications over the same HTTP server
- [class-validator / class-transformer](https://github.com/typestack/class-validator) — DTO validation via a global `ValidationPipe`
- [BullMQ + Redis](https://docs.bullmq.io/) — email/notification queues; `@nestjs/schedule` for cron (fee reminders)
- [Stripe](https://stripe.com/) (international) + [SSLCommerz](https://sslcommerz.com/) (Bangladesh) — payments; [Resend](https://resend.com/) — transactional email ([React Email](https://react.email/) templates in `src/mail/templates/`); [Cloudinary](https://cloudinary.com/) — file storage
- `@nestjs/throttler` — rate limiting; `helmet` — security headers
- Deployed on **Render**

---

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run start:dev`  | Dev server with watch                |
| `npm run build`      | `nest build`                         |
| `npm run start:prod` | Run the built server                 |
| `npm run lint`       | oxlint                               |
| `npm test`           | Vitest (`test:watch` to watch)       |
| `npm run test:e2e`   | Vitest e2e (`test/**/*.e2e-spec.ts`) |
| `npm run format`     | Prettier (`format:check` to verify)  |

---

## Conventions

- **Layers:** Controller → Service → TypeORM repository → PostgreSQL. Controllers
  stay thin; services never touch HTTP objects.
- **Naming:** `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.gateway.ts`;
  DTOs in per-module `dto/` as `create-*.dto.ts` / `update-*.dto.ts`.
- **Tenancy:** every table carries `schoolId`, and every query is scoped to it —
  no unscoped reads.
- **Data access:** services inject `Repository<Entity>` classes
  (`@InjectRepository`) and `DataSource` for transactions; nothing queries the
  database outside a service.
- **Schema:** there are no migrations and `synchronize` stays off — the entities
  are a mapping onto existing tables, and every schema change is applied by hand
  in the Supabase SQL editor. The ORM never reshapes a shared database.
- **Responses:** the global interceptor/filter shape the response envelope;
  services throw `HttpException` subclasses and never build HTTP responses.
- **Secrets:** never return `passwordHash` or OTPs; keep `.env` out of git.
- **Money:** store as integer paise, never floats.
- **Emails:** templates are React Email (`.tsx`) components in `src/mail/templates/`,
  rendered to HTML with `render()` and sent through Resend — no hand-written HTML.
- Run lint + build before finishing.

---

## Docs

The backend docs are the source of truth — read the ones for the side you're touching before
starting. `Database.md` is deliberately a short **index**: it names the tables and enums and
points at the file that carries the detail.

| File                                                                 | Purpose                                                                                            |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [`../docs/backend/PRD.md`](../docs/backend/PRD.md)                   | What to build and for whom — §4 is the per-endpoint checklist                                      |
| [`../docs/backend/Architecture.md`](../docs/backend/Architecture.md) | Structure, flow, stack, and the domain-to-module map                                               |
| [`../docs/backend/Rules.md`](../docs/backend/Rules.md)               | Constraints — use / avoid                                                                          |
| [`../docs/backend/Phases.md`](../docs/backend/Phases.md)             | Delivery order — one phase at a time                                                               |
| [`../docs/backend/Design.md`](../docs/backend/Design.md)             | API contract — envelopes, URL conventions, naming, paise                                           |
| [`../docs/backend/Schema.md`](../docs/backend/Schema.md)             | Every table's columns, keys, indexes and constraints, plus the §16 planned tables                  |
| [`../docs/backend/Erd.md`](../docs/backend/Erd.md)                   | The full ERD, per-feature sub-diagrams, the FK map and the logical links                           |
| [`../docs/backend/Access.md`](../docs/backend/Access.md)             | Roles, per-role navigation, the per-route access table, the 60-code error catalogue, client guards |
| [`../docs/backend/Database.md`](../docs/backend/Database.md)         | The index — conventions, table inventory, enums, open questions                                    |
| [`../docs/backend/Memory.md`](../docs/backend/Memory.md)             | Session state — completed work, active task, blockers, decisions                                   |

Full repo workflow: [`../AGENTS.md`](../AGENTS.md). Client side:
[`../frontend/README.md`](../frontend/README.md). Security policy:
[`../SECURITY.md`](../SECURITY.md).

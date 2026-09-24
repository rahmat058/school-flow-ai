# School Flow AI — Backend

NestJS + Supabase (PostgreSQL) API for School Flow AI — auth, schools,
users, and the attendance, fees, homework, exams, chat, notices, AI, and reports
modules that serve the frontend over `/api/v1`.

Part of the [school-flow-ai](../README.md) monorepo. The backend docs in
[`../docs/backend/`](../docs/backend) are the source of truth.

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT secrets, etc.
npm run start:dev
```

The database schema lives in your Supabase project — manage tables and migrations
with the Supabase SQL editor or CLI.

Validate before finishing any task:

```bash
npm run lint && npm run build
```

---

## Folder structure

```text
backend/
├── supabase/                 # DB schema + migrations (Supabase project)
├── src/
│   ├── main.ts               # bootstrap: /api/v1 prefix, pipes, filters, helmet, CORS
│   ├── app.module.ts
│   ├── database/             # Supabase client module (global)
│   ├── common/
│   │   ├── guards/           # jwt-auth, roles, tenant
│   │   ├── decorators/       # @Roles, @CurrentUser, @SchoolId
│   │   ├── filters/          # global exception filter
│   │   ├── interceptors/     # response envelope, logging
│   │   └── pipes/            # validation helpers
│   ├── auth/                 # strategies, guards, dto
│   ├── schools/              # registration, OTP, settings
│   ├── users/                # teachers, students, parents
│   ├── classes/              # classes + subjects
│   ├── attendance/
│   ├── fees/                 # structures, invoices, payments, concessions
│   ├── homework/
│   ├── timetables/
│   ├── exams/                # exams, results, report cards
│   ├── chat/                 # gateway + conversations + messages
│   ├── notices/              # notices + events
│   ├── ai/                   # AI assistant features
│   ├── materials/            # study material uploads
│   ├── reports/              # analytics + CSV export
│   └── mail/                 # Resend mailer + react-email .tsx templates
├── package.json
└── .env                      # not committed
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
- [Supabase](https://supabase.com/) — PostgreSQL database and data access (`@supabase/supabase-js`), service-role key on the server only
- [Passport.js + JWT](https://www.passportjs.org/) — access (15m) + refresh (7d) auth
- [Socket.io](https://socket.io/) — chat and notifications over the same HTTP server
- [class-validator / class-transformer](https://github.com/typestack/class-validator) — DTO validation via a global `ValidationPipe`
- [BullMQ + Redis](https://docs.bullmq.io/) — email/notification queues; `@nestjs/schedule` for cron (fee reminders)
- [Stripe](https://stripe.com/) (international) + [SSLCommerz](https://sslcommerz.com/) (Bangladesh) — payments; [Resend](https://resend.com/) — transactional email ([React Email](https://react.email/) templates in `src/mail/templates/`); [Cloudinary](https://cloudinary.com/) — file storage
- `@nestjs/throttler` — rate limiting; `helmet` — security headers

---

## Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run start:dev`  | Dev server with watch               |
| `npm run build`      | `nest build`                        |
| `npm run start:prod` | Run the built server                |
| `npm run lint`       | ESLint                              |
| `npm test`           | Jest (`test:watch` to watch)        |
| `npm run format`     | Prettier (`format:check` to verify) |

---

## Conventions

- **Layers:** Controller → Service → Supabase client → PostgreSQL. Controllers
  stay thin; services never touch HTTP objects.
- **Naming:** `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.gateway.ts`;
  DTOs in per-module `dto/` as `create-*.dto.ts` / `update-*.dto.ts`.
- **Tenancy:** every table carries `schoolId`, and every query is scoped to it —
  no unscoped reads.
- **Transparency:** all DB access goes through the global Supabase client module;
  the service-role key is used on the server only — never expose it to the client.
- **Migrations:** keep every schema change in a Supabase migration (SQL editor or
  CLI) so the schema stays reproducible.
- **Responses:** the global interceptor/filter shape the response envelope;
  services throw `HttpException` subclasses and never build HTTP responses.
- **Secrets:** never return `passwordHash` or OTPs; keep `.env` out of git.
- **Money:** store as integer paise, never floats.
- **Emails:** templates are React Email (`.tsx`) components in `src/mail/templates/`,
  rendered to HTML with `render()` and sent through Resend — no hand-written HTML.
- Run lint + build before finishing.

---

## Docs

| File                                                                 | Purpose                                 |
| -------------------------------------------------------------------- | --------------------------------------- |
| [`../docs/backend/PRD.md`](../docs/backend/PRD.md)                   | What to build and for whom              |
| [`../docs/backend/Architecture.md`](../docs/backend/Architecture.md) | Structure, flow, stack                  |
| [`../docs/backend/Rules.md`](../docs/backend/Rules.md)               | Constraints — use / avoid               |
| [`../docs/backend/Phases.md`](../docs/backend/Phases.md)             | Delivery order                          |
| [`../docs/backend/Design.md`](../docs/backend/Design.md)             | API contract (envelopes, naming, paise) |
| [`../docs/backend/Database.md`](../docs/backend/Database.md)         | ERD — tables, enums, constraints        |
| [`../docs/backend/Memory.md`](../docs/backend/Memory.md)             | Session state                           |

Full repo workflow: [`../AGENTS.md`](../AGENTS.md). Client side:
[`../frontend/README.md`](../frontend/README.md). Security policy:
[`../SECURITY.md`](../SECURITY.md).

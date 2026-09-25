# Architecture — Backend

## App flow

React client → `api/v1` REST (NestJS controllers) → guards (`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` → tenant scope) → services (business logic) → Supabase client → PostgreSQL (Supabase). Real-time chat/notifications flow over a Socket.io gateway sharing the same HTTP server. Background jobs (emails, reminders) run through BullMQ/Redis. Email jobs render a React Email template to HTML and deliver it through Resend.

Layers: **Controller → Service → Supabase client → PostgreSQL**. Controllers never contain business logic; services never touch HTTP objects.

## Request lifecycle

```mermaid
flowchart TB
  client["React client"] --> api["/api/v1"]
  api --> token{"Global token check<br/>against PUBLIC_PATHS"}
  token -->|public path| role
  token -->|no / invalid token| unauth["401 AUTH_UNAUTHENTICATED"]
  token -->|valid token| role{"Per-route role +<br/>ownership check (where present)"}
  role -->|refused| forbidden["403 — role / ownership code"]
  role -->|allowed| service["Service (business logic)"]
  service --> store[("Data store — Supabase, or the in-repo mock seed")]
  store --> envelope["Envelope { success, data, meta? }"]
```

Today that chain runs against the **in-repo mock adapter** (`frontend/src/services/mockAdapter.ts`), which answers every request from the deterministic seed in `frontend/src/data/*` and returns the real envelope. Its global step is the `PUBLIC_PATHS` set, and only **ten** routes carry a per-route role or ownership check (`PRD.md` §2). A real **NestJS backend replaces the mock behind the same contract** — the same paths, guards, envelopes and error codes — and the route table, ownership rules and error catalogue it must match are in [`Access.md`](./Access.md).

## Folder structure

```
backend/
├── supabase/
│   └── migrations/             # SQL migrations — source of truth for the DB schema
├── src/
│   ├── main.ts               # Bootstrap: prefix, pipes, filters, helmet, CORS
│   ├── app.module.ts
│   ├── database/             # Supabase client module (global injectable service)
│   ├── common/               # guards, decorators, filters, interceptors, pipes
│   │   ├── guards/           # jwt-auth, roles, permissions, tenant
│   │   ├── decorators/       # @Roles, @RequirePermission, @CurrentUser, @SchoolId
│   │   ├── filters/          # global exception filter
│   │   └── interceptors/     # response envelope, logging
│   ├── auth/                 # strategies, guards, dto + the RBAC catalogue & per-user grants
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
│   ├── ai/                   # 7 AI features (ai_feature enum): quiz, homework help, event plan, notice, chat, report comment, fee reminder
│   ├── materials/            # study material uploads
│   ├── reports/              # analytics + CSV export
│   └── mail/                 # Resend mailer + react-email .tsx templates
├── package.json
└── .env
```

**Naming:** `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.gateway.ts`; DTOs in `dto/` per module with `create-*.dto.ts` / `update-*.dto.ts`. Each feature module owns its routes under `/api/v1/<feature>`.

## Domain-to-module map

Each routing domain and the module that owns it, with the tables the module reads or writes — derived from [`Schema.md`](./Schema.md) §14. `(planned)` marks a table the design target adds; the mock keeps that relationship inline (`Schema.md` §15).

| Domain      | Module           | Tables touched                                                                                             |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| auth        | AuthModule       | `users`, `permissions`, `user_permissions` (`refresh_tokens` planned)                                      |
| school      | SchoolsModule    | `schools`, `users` (`otps` planned)                                                                        |
| users       | AuthModule       | `users`, `permissions`, `user_permissions` — the `/users/:userId/permissions` routes                       |
| teachers    | UsersModule      | `teachers`, `users`, `teacher_classes`                                                                     |
| students    | UsersModule      | `students`, `users`, `classes`, `parent_students`                                                          |
| parents     | UsersModule      | `parents`, `users`, `parent_students`                                                                      |
| classes     | ClassesModule    | `classes`, `students`, `class_subjects`, `teacher_classes`                                                 |
| subjects    | ClassesModule    | `subjects`, `class_subjects`                                                                               |
| attendance  | AttendanceModule | `attendance`, `classes`, `students`                                                                        |
| homework    | HomeworkModule   | `homework`, `homework_submissions`                                                                         |
| materials   | MaterialsModule  | `study_materials`                                                                                          |
| timetable   | TimetablesModule | `timetables`, `periods`                                                                                    |
| exams       | ExamsModule      | `exams`, `exam_subjects`, `results`, `report_cards`                                                        |
| fees        | FeesModule       | `fee_structures`, `fee_heads`, `fee_invoices`, `fee_payments`, `concessions` (`receipt_sequences` planned) |
| notices     | NoticesModule    | `notices`, `events` (`notice_classes` planned)                                                             |
| chat        | ChatModule       | `conversations`, `messages` (`conversation_participants` planned)                                          |
| ai          | AiModule         | `ai_conversations`                                                                                         |
| reports     | ReportsModule    | none — aggregates over the modules that own tables                                                         |
| progress    | ReportsModule    | none — a projection over `exams`, `exam_subjects`, `results`, `report_cards`                               |
| dashboard   | ReportsModule    | none — aggregates over attendance, fees, exams, classes and people                                         |
| permissions | AuthModule       | `permissions`, `user_permissions`, `users`                                                                 |

The full entity relationships are in [`Erd.md`](./Erd.md); the per-table columns, keys, indexes and constraints in [`Schema.md`](./Schema.md).

## Tech stack

- **NestJS 12 (TypeScript)** — modular framework with DI
- **Supabase** — PostgreSQL database and data access (`@supabase/supabase-js`); service-role key on the server only; schema managed via Supabase migrations
- **Passport.js + JWT** — access (15m) + refresh (7d) auth
- **Socket.io** (`@WebSocketGateway`) — chat and notifications
- **class-validator / class-transformer** — DTO validation via global ValidationPipe
- **BullMQ + Redis** — email/notification queues; `@nestjs/schedule` for cron (fee reminders)
- **Stripe** (international) + **SSLCommerz** (Bangladesh) — payments; **Resend** — transactional email; **Cloudinary** — file storage
- **React Email** (`react-email`) — email templates written as `.tsx` components in `src/mail/templates/`, rendered to HTML with `render()` and sent through Resend; live preview with the `email dev` CLI
- **@nestjs/throttler** — rate limiting; **helmet** — headers
- Deployed on **Render**

## Real-time chat (`ChatModule`)

The split is deliberate: **Socket.io carries live traffic, REST carries history.**

- The gateway (`*.gateway.ts`) authenticates the JWT on `handleConnection`, then `chat:join` subscribes the socket
  to one conversation — only once the allowed-pair check (admin↔teacher, teacher↔student, teacher↔parent) passes.
- `chat:message` **persists first, then fans out**, so a client never sees a message the database has not
  accepted. `chat:typing` is ephemeral and never persisted.
- Read state lives on `conversation_participants.last_read_at`: `chat:read` and `POST /chat/:conversationId/read`
  both stamp it, and the inbox's unread count is derived from it rather than stored on `conversations`.
- `GET /chat/conversations` and `GET /chat/:conversationId/messages` hydrate the client on load and are scoped to
  the caller, so a non-participant gets a 403 instead of a thread.
- Payloads reuse the REST DTO shapes, so one serializer serves both transports.
- Notifications (`notification:new`) ride the same gateway, which is why it is not chat-specific.

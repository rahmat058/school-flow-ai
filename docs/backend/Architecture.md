# Architecture — Backend

## App flow

React client → `api/v1` REST (NestJS controllers) → guards (`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` → tenant scope) → services (business logic) → Supabase client → PostgreSQL (Supabase). Real-time chat/notifications flow over a Socket.io gateway sharing the same HTTP server. Background jobs (emails, reminders) run through BullMQ/Redis. Email jobs render a React Email template to HTML and deliver it through Resend.

Layers: **Controller → Service → Supabase client → PostgreSQL**. Controllers never contain business logic; services never touch HTTP objects.

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
│   ├── schools/              # registration, OTP, settings
│   ├── users/                # teachers, students, parents
│   ├── classes/              # classes + subjects
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

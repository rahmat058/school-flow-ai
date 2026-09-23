# Architecture — Backend

## App flow

React client → `api/v1` REST (NestJS controllers) → guards (`JwtAuthGuard` → `RolesGuard` → tenant scope) → services (business logic) → Supabase client → PostgreSQL (Supabase). Real-time chat/notifications flow over a Socket.io gateway sharing the same HTTP server. Background jobs (emails, reminders) run through BullMQ/Redis.

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
│   │   ├── guards/           # jwt-auth, roles, tenant
│   │   ├── decorators/       # @Roles, @CurrentUser, @SchoolId
│   │   ├── filters/          # global exception filter
│   │   └── interceptors/     # response envelope, logging
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
│   ├── ai/                   # 8 AI assistant features
│   ├── materials/            # study material uploads
│   ├── reports/              # analytics + CSV export
│   └── mail/                 # mailer + handlebars templates
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
- **Razorpay** — payments; **Nodemailer** — SMTP email; **Cloudinary** — file storage
- **@nestjs/throttler** — rate limiting; **helmet** — headers
- Deployed on **Render**

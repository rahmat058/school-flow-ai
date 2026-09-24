# Rules — Backend

## Use

- NestJS conventions: one module per domain, controllers thin, services hold business logic
- DTO + `class-validator` for every request body/query — no untyped `req.body` access
- Supabase client for all DB access through the global `database/` module; multi-write operations (registration, payment confirmation, result publishing) run in a database transaction (Supabase RPC)
- Postgres enums (or CHECK constraints) for fixed value sets (`Role`, `AttendanceStatus`, `PaymentStatus`, …)
- `@Roles()` + `RolesGuard` on role-restricted routes; tenant scope (`schoolId`) applied in every query
- Response envelope + error envelope via global interceptor/filter — services throw `HttpException` subclasses, never shape responses manually
- `@nestjs/throttler` on auth/OTP/AI endpoints
- Emails: one React Email component per message (`.tsx` in `src/mail/templates/`), rendered to HTML with `render()` and sent through Resend — templates are code, reviewed like any module
- Run `npm run lint` and `npm run build` before finishing any task

## Avoid

- Business logic in controllers or guards
- Calling the DB client from outside services (no direct Supabase calls in gateways or controllers — go through injected services)
- Raw SQL except for heavy report aggregations — and then only parameterized queries (RPC/`sql` template)
- Hand-writing email HTML or string-based templating (Handlebars) — every message is a React Email component rendered to HTML
- Returning entities with sensitive fields (`passwordHash`, OTP codes) — strip via serializer/select
- New npm packages without approval
- Editing modules outside the requested scope
- Catching errors silently — let the global filter handle them

## AI boundaries

- Read `docs/backend/PRD.md` and `Architecture.md` before implementing features
- Follow `docs/backend/Phases.md` — complete one phase before starting the next
- Never commit unless asked
- Do not install packages without explicit approval
- Every schema change = a new Supabase migration in `supabase/migrations`, never direct edits to a shared database
- Match existing module conventions before introducing new patterns
- Minimize diff size — smallest correct change wins

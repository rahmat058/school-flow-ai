# Rules — Backend

## Use

- NestJS conventions: one module per domain, controllers thin, services hold business logic
- DTO + `class-validator` for every request body/query — no untyped `req.body` access
- Prisma for all DB access through the global `PrismaService`; transactions via `$transaction` for multi-write operations (registration, payment confirmation, result publishing)
- Prisma enums for fixed value sets (`Role`, `AttendanceStatus`, `PaymentStatus`, …)
- `@Roles()` + `RolesGuard` on role-restricted routes; tenant scope (`schoolId`) applied in every query
- Response envelope + error envelope via global interceptor/filter — services throw `HttpException` subclasses, never shape responses manually
- `@nestjs/throttler` on auth/OTP/AI endpoints
- Run `npm run lint` and `npm run build` before finishing any task

## Avoid

- Business logic in controllers or guards
- Calling Prisma from outside services (no Prisma in gateways except via injected services)
- Raw SQL except for heavy report aggregations — and then only parameterized `$queryRaw`
- Returning entities with sensitive fields (`passwordHash`, OTP codes) — strip via serializer/select
- New npm packages without approval
- Editing modules outside the requested scope
- Catching errors silently — let the global filter handle them

## AI boundaries

- Read `docs/backend/PRD.md` and `Architecture.md` before implementing features
- Follow `docs/backend/Phases.md` — complete one phase before starting the next
- Never commit unless asked
- Do not install packages without explicit approval
- Every schema change = a new Prisma migration, never `db push` to shared environments
- Match existing module conventions before introducing new patterns
- Minimize diff size — smallest correct change wins

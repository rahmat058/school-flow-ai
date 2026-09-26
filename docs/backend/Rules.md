# Rules — Backend

## Use

- NestJS conventions: one module per domain, controllers thin, services hold business logic
- DTO + `class-validator` for every request body/query — no untyped `req.body` access
- TypeORM repositories (`@InjectRepository(Entity)`) for all DB access; multi-write operations (registration, payment confirmation, result publishing) run in a `DataSource` transaction
- Entities in `src/database/entities/` declare the schema in code — every `@Column` carries an explicit `name:` so DB identifiers stay `snake_case` while properties are `camelCase`; `synchronize` is **off**, always
- Postgres enums (or CHECK constraints) for fixed value sets (`Role`, `AttendanceStatus`, `PaymentStatus`, …)
- JSONB documents (e.g. `schools.settings`) are validated by their DTO against the unions in `Design.md`/`PRD.md` — Postgres constrains the column, not its keys — and a `PATCH` **merges** so a partial write never drops a key it did not send
- `@Roles()` + `RolesGuard` for the coarse role check, then `@RequirePermission()` + `PermissionsGuard` against `user_permissions` for a fine-grained grant; tenant scope (`schoolId`) applied in every query
- Response envelope + error envelope via global interceptor/filter — services throw `HttpException` subclasses, never shape responses manually
- `@nestjs/throttler` on auth/OTP/AI endpoints
- Emails: one React Email component per message (`.tsx` in `src/mail/templates/`), rendered to HTML with `render()` and sent through Resend — templates are code, reviewed like any module
- Run `npm run lint` and `npm run build` before finishing any task
- `frontend/src/services/mockAdapter.ts` is the spec for routes and payloads — where it and `PRD.md` diverge, the divergence is a documentation bug until a real backend overtakes the mock

## Avoid

- Business logic in controllers or guards
- Calling a repository or the DataSource from outside services (no direct ORM calls in gateways or controllers — go through injected services)
- Raw SQL except for heavy report aggregations — and then only parameterized queries (the query builder, or `query(sql, params)`)
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
- The schema is **not** ORM-managed: there are no migrations, and every schema change is applied by hand (Supabase SQL editor or a checked-in `.sql` file). Never `synchronize: true` — the entities in `src/database/entities/` are a mapping onto existing tables, never a way to reshape a shared database
- A schema change touches [`Schema.md`](./Schema.md), [`Erd.md`](./Erd.md) and [`Database.md`](./Database.md) together — no table edit lands in one without the other two
- Match existing module conventions before introducing new patterns
- Minimize diff size — smallest correct change wins

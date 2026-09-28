# Rules — Backend

## Use

- NestJS conventions: one module per domain, controllers thin, services hold business logic
- DTO + `class-validator` for every request body/query — no untyped `req.body` access
- TypeORM repositories (`@InjectRepository(Entity)`) for all DB access; multi-write operations (registration, payment confirmation, result publishing) run in a `DataSource` transaction
- Entities in `src/database/entities/` declare the schema in code — every `@Column` carries an explicit `name:` so DB identifiers stay `snake_case` while properties are `camelCase`; `synchronize` is **off**, always
- Postgres enums (or CHECK constraints) for fixed value sets (`Role`, `AttendanceStatus`, `PaymentStatus`, …)
- JSONB documents (e.g. `schools.settings`) are validated by their DTO against the unions in `Design.md`/`PRD.md` — Postgres constrains the column, not its keys — and a `PATCH` **merges** so a partial write never drops a key it did not send
- `@Roles()` + `RolesGuard` for the coarse role check, then `@RequirePermission()` + `PermissionsGuard` against `user_permissions` for a fine-grained grant; tenant scope (`schoolId`) applied in every query
- Response envelope + error envelope via global interceptor/filter, both carrying a top-level `message` — a success route sets it with `@ResponseMessage('…')` (method default otherwise), an error repeats the thrown message — services throw `HttpException` subclasses, never shape responses manually
- `Cache-Control` on every response, set by the global `CacheControlInterceptor` from the `@Public()` marker — `public, max-age=60` for a public route, `private, max-age=5` for an authenticated one; never set per route
- `@nestjs/throttler` on auth/OTP/AI endpoints
- Log through the global pipeline, never `console.log`: `LoggingInterceptor` emits the success line on response `finish` (skipping `>= 400`), and `AllExceptionsFilter` emits every error line with the thrown exception class, `code` and `message` (`warn` for `4xx`, `error` + stack for `5xx`) — each line carries the HTTP method, path and status reason phrase
- Emails: one React Email component per message (`.tsx` in `src/mail/templates/`), rendered to HTML with `render()` and sent through Resend — templates are code, reviewed like any module
- A service's exported types/interfaces live in a sibling `<service>.interface.ts` (`auth.interface.ts`, `registration.interface.ts`, `health.interface.ts`), never inline in the `*.service.ts` — import them with `import type`; the service file exports the class only
- Shared DI-free helpers (pure functions, no `@Injectable`) live in `src/common/utils/` — e.g. `verification-token.util.ts` (token mint/hash/expiry) — imported directly rather than through a service
- API docs are generated from the code, never hand-written: `@nestjs/swagger` builds them with the CLI plugin in `nest-cli.json` (`classValidatorShim`, `introspectComments`), so DTO/entity schemas come from TypeScript types + class-validator decorators and need no hand-written `@ApiProperty`; add `@ApiTags`/`@ApiOperation`/`@ApiResponse` only where the generated shape is not enough. The config lives in `src/swagger/`, `main.ts` mounts it after the global prefix, the UI is at `/docs` and the JSON at `/docs/json`
- Monitoring: `@nestjs/observe` is wired once in `app.module.ts` (`ObserveModule.forRoot()` with `OBSERVE_APP_KEY`/`OBSERVE_APP_SECRET` and `serviceId: 'school-flow-ai'`) and `main.ts` (`instrument: ObserveInstrument`) — it ships traces, correlated logs, request/job metrics and error telemetry to <https://www.observe.nestjs.com/dashboard>. The app key/secret are secrets: read them from env, never inline or commit them
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

# Code Reviewer — School Flow AI

Apply this checklist to every change before it is considered done. Review the **diff**, not the whole repo. Flag violations with file + line and a concrete fix.

## 1. Correctness

- [ ] Logic matches the requirement in `docs/*/PRD.md` and the active phase in `docs/*/Phases.md`
- [ ] Edge cases handled: empty lists, missing relations, duplicate submissions, invalid dates
- [ ] No dead code, unused imports, commented-out blocks, or leftover debug logs
- [ ] Error paths return/throw the correct shapes — no silent catches

## 2. Security (blocking)

- [ ] Every protected route has `JwtAuthGuard` + `RolesGuard` with the correct roles
- [ ] Every query is scoped by `schoolId` — no cross-school data leaks
- [ ] All request bodies validated by DTOs (`class-validator`, `whitelist: true`)
- [ ] No sensitive data in responses or logs (`passwordHash`, OTPs, tokens)
- [ ] Payment confirmation verifies Stripe signatures and SSLCommerz IPN; file uploads validate type + size
- [ ] No SQL injection risk (parameterized queries via Supabase only); no XSS (no `dangerouslySetInnerHTML`)

## 3. Backend conventions (NestJS + Supabase)

- [ ] Controllers are thin; business logic lives in services
- [ ] Multi-write operations run in a database transaction
- [ ] Schema changes come with a migration — never `db push` to shared DBs
- [ ] Responses use the envelope from `docs/backend/Design.md`; errors use domain codes (`FEE_NOT_FOUND`)
- [ ] Money is integer paise; dates ISO-8601; IDs UUID; enums `SCREAMING_SNAKE`

## 4. Frontend conventions (React + Tailwind)

- [ ] Tailwind utilities only; `cn()` for conditionals; no hardcoded colors — tokens from `docs/frontend/Design.md`
- [ ] Server state goes through TanStack Query hooks in `src/services/` or feature `api.ts` — never raw fetch or `useEffect` fetching in components
- [ ] Mutations invalidate the queries they affect; `queryKey` arrays are consistent and colocated with the feature that owns them
- [ ] Icons from `lucide-react`; charts from Recharts only
- [ ] Components typed (props + API data); loading, empty, and error states present
- [ ] New features live in `src/features/<name>/`; pages in `src/pages/<role>/`

## 5. Performance

- [ ] List endpoints paginated (`take=20` default); no N+1 queries (select fields deliberately)
- [ ] Indexes exist for new query patterns (attendance by class+date, messages by conversation)
- [ ] Frontend: no unnecessary re-renders; heavy lists virtualized or paginated; charts memoized
- [ ] CSV exports stream; heavy reports use aggregations, not in-memory loops

## 6. Scope & hygiene

- [ ] Diff is minimal — no unrelated edits, reformatting, or drive-by refactors
- [ ] No new dependencies without approval
- [ ] Lint + typecheck (frontend) / lint + build (backend) pass
- [ ] `Memory.md` updated if the change completes a phase item or makes a lasting decision

## Severity labels

- 🔴 **Blocker** — security hole, data leak, broken flow, failing validation. Must fix.
- 🟡 **Should fix** — convention violation, missing error state, performance smell.
- 🔵 **Nit** — naming, style, minor simplification. Optional.

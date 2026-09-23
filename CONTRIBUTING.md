# Contributing to School Flow AI

Thanks for helping improve this school management system. By participating, you
agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to help

- **Bugs and features** — open an issue with the role/dashboard affected (Admin,
  Teacher, Student, Parent), steps to reproduce, and what you expected vs what
  you got. Include the frontend or backend side in the title.
- **Docs** — `docs/frontend/*` and `docs/backend/*` are the source of truth
  (PRD, Architecture, Rules, Phases, Design, Memory). Keep code and docs in
  sync: update the relevant `Memory.md` at the end of a session as described in
  [AGENTS.md](./AGENTS.md).
- **Code** — small, focused pull requests are easier to review than large
  redesigns. Touch only the files the task needs; never refactor unrelated code.

Never paste real student, parent, or payment data into issues or PRs, and never
commit secrets (`.env`, Supabase keys, JWT secrets, Stripe / SSLCommerz keys). For security
reports, see **[SECURITY.md](./SECURITY.md)** (do not file them as public
issues).

## Development setup

You need **Node.js 20+** and a **PostgreSQL** database (Supabase project
recommended).

```bash
git clone https://github.com/rahmat058/school-flow-ai.git
cd school-flow-ai
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT secrets, etc.
npx supabase db push   # apply backend/supabase/migrations to your Supabase project
npm run start:dev
```

The frontend talks to the backend at `/api/v1` per
[docs/backend/Design.md](./docs/backend/Design.md) — same envelopes, naming, and
money in paise.

## Before you open a pull request

1. Read the docs for the side you touched (`docs/frontend/*` or
   `docs/backend/*`) and follow their Rules and Phases.
2. Run the side's validation:
   - **Frontend:** `cd frontend && npm run lint && npm run typecheck`
   - **Backend:** `cd backend && npm run lint && npm run build`
3. Keep the current phase in `Phases.md` complete before moving on, and don't
   advance to the next phase in the same PR.
4. If your change touches the DB schema, add a Supabase migration under
   `backend/supabase/migrations` and update `docs/backend/Database.md`; if it
   changes the API contract, update `docs/backend/Design.md` and the matching
   frontend `Memory.md`.
5. Update the relevant `Memory.md` (completed work, active file, decisions).

## Git hooks

`npm install` runs Husky (`prepare`) from the repo root. Hooks run in this
order:

1. **pre-commit** — lint-staged (`eslint --fix` + Prettier on staged files)
2. **commit-msg** — prepends the type emoji when missing (e.g. `fix:` →
   `🐛 fix:`), then checks [Conventional Commits](https://www.conventionalcommits.org/)

If commit output looks plain on Windows, use
[Windows Terminal](https://aka.ms/terminal) and update
[Git for Windows](https://git-scm.com/downloads).

## Commit messages

The `commit-msg` hook prepends the type emoji when it is missing, then rejects
messages that are not conventional. You can type the emoji yourself, or use
`npm run commit` for the interactive prompt. Use this shape:

```text
fix: short summary in lowercase
```

After the hook, git stores:

```text
🐛 fix: short summary in lowercase
```

- **Header** — optional type emoji (trailing space), then `type`, optional
  `scope`, then the summary
- **Issues** — optional GitHub refs in the body/footer (for example `Closes #12`)
- **Breaking change** — add `!` after the type (or type+scope), and a
  `BREAKING CHANGE:` footer when the public API envelope or DB schema changes
- **Prompt** — `npm run commit` after `git add` (Commitizen + Commitlint)

### Types

| Type       | Emoji | When to use                                                     |
| ---------- | ----- | --------------------------------------------------------------- |
| `feat`     | ✨    | User-facing behavior (attendance, fees, homework, chat, …)      |
| `fix`      | 🐛    | Bug fix                                                         |
| `docs`     | 📚    | README, docs/, license, contributing, security, code of conduct |
| `style`    | 💎    | Formatting only (Prettier, no logic change)                     |
| `refactor` | 📦    | Internal change with no feature or fix                          |
| `perf`     | 🚀    | Performance                                                     |
| `test`     | 🚨    | Tests only                                                      |
| `build`    | 🛠️    | Build system or dependency change (Vite, Nest, Supabase, npm)   |
| `ci`       | ⚙️    | Hooks, Commitlint, lint-staged, GitHub Actions                  |
| `chore`    | ♻️    | Maintenance that does not fit the types above                   |
| `revert`   | 🗑️    | Revert a previous commit                                        |

Suggested scopes: `frontend`, `backend`, `auth`, `api`, `db`, `ui`, `docs`.

### Community files (`docs`)

```text
📚 docs: add mit license
```

```text
docs: add contributor covenant code of conduct
```

```text
docs: add contributing guide and security policy
```

### Other examples

```text
✨ feat(frontend): add attendance sheet for teacher dashboard
```

```text
feat(backend): scope fee invoices to the caller's school

Reject any query that is missing schoolId.
```

```text
🐛 fix(auth): refresh access token before it expires
```

```text
feat(api)!: rename invoice envelope field to data

BREAKING CHANGE: frontend must read response.data instead of response.payload.
```

### Rejected by Commitlint

```text
Updated security policy
```

Missing conventional `type:`.

```text
Feat: add security policy
```

Type must be lowercase (`feat`, not `Feat`).

## Pull requests

- Branch from `main` (or the default branch).
- Keep the change scoped: one concern per PR when you can.
- Describe **why**, not only what files changed.
- Do not commit `node_modules`, `dist`, `.env`, or generated build artifacts.

## Project map

| Area                        | Path                                   |
| --------------------------- | -------------------------------------- |
| Frontend entry + routing    | `frontend/src/main.tsx`, `App.tsx`     |
| Role pages                  | `frontend/src/pages/`                  |
| Shared UI primitives        | `frontend/src/components/ui/`          |
| Feature modules (frontend)  | `frontend/src/features/`               |
| API + socket clients        | `frontend/src/services/`               |
| Backend entry + modules     | `backend/src/main.ts`, `app.module.ts` |
| Database schema             | `backend/supabase/migrations/`         |
| Shared guards/decorators    | `backend/src/common/`                  |
| Product + architecture docs | `docs/frontend/`, `docs/backend/`      |

Follow the folder conventions in
[docs/frontend/Architecture.md](./docs/frontend/Architecture.md) and
[docs/backend/Architecture.md](./docs/backend/Architecture.md) before
introducing new patterns.

## License

Contributions are licensed under the [MIT License](./LICENSE).

# Rules — Frontend

## Use

- Tailwind utility classes with theme tokens from `src/styles/index.css`
- `cn()` from `src/lib/cn.ts` for conditional classes
- `lucide-react` for all icons
- Recharts for all charts — never mix in another chart library
- `motion` for all animations and transitions — import React APIs from `motion/react`, never from `framer-motion`
- Function components + hooks; TypeScript strict types for all props and API data
- Design-system primitives from `src/components/ui/` before writing one-off markup
- TanStack Query (`@tanstack/react-query`) for all server state — `useQuery`/`useMutation` hooks live in the feature `api.ts`; components consume hooks, never the API client
- Zustand for client-only state (auth/session, school context) only — never as a cache for API responses
- `react-hook-form` for all form state and validation — `register()` on the `components/ui` inputs, `Controller` for Select/Checkbox/Radio/Switch, `formState.isSubmitting` for the submit button, and `setError('root.serverError')` for API failures
- UI input primitives must accept a `ref` (`ComponentPropsWithRef`) so `register()` can focus the first invalid field
- Password fields use `PasswordInput` (masked by default, eye toggle in `Input`'s `trailing` slot) — never `type="password"` on a bare `Input`; `Input`'s `trailing` slot is the place for any other end-of-field adornment
- Brand artwork comes from `src/lib/brand.ts` (`public/` assets) — never hardcode a logo path, and keep the collapsed rail's mark and the auth wordmark distinct
- Wrap main content in the `page-container` utility (`src/styles/index.css`) — never re-declare `mx-auto max-w-* px-*` in a page or section
- The login role picker is a portal choice, never an authorisation: the authenticated account's role decides what opens, and a mismatch is surfaced in a toast rather than silently accepted
- Dashboard activity rows must trace to a record that exists (payment, submission, notice) — there is no audit log, so never fabricate events to fill a feed
- List rows arrive with their roll-ups computed for them (roll number, attendance share, fee standing) — joins and aggregates belong in the API layer, or in the mock adapter standing in for it, never in the view
- Creates and edits open in the `Sheet` rather than navigating away; a record's full detail is a **route with tabs** (`/students/:id`), reached from the row menu's View. Row actions live in a trailing ellipsis `Dropdown`, and every destructive one goes through `ConfirmDialog` first. Writes invalidate the feature's query key instead of patching the cache by hand
- `react-day-picker` is themed through its CSS variables in `src/styles/index.css`; its stylesheet is imported once there and its rules are deliberately unlayered, because Tailwind utilities live in `@layer utilities` and would lose the cascade to the library's own `.rdp-*` rules
- Heavy optional libraries (the PDF renderer, charting, day-picker) are imported **on demand** inside the action that needs them, so they ship as their own chunk instead of taxing the initial bundle
- Interactive hover is `hover:bg-primary-soft` + `hover:text-primary`, everywhere (buttons, nav, icon buttons, menu/option highlights) — don't introduce another hover treatment; table rows take the tint only (data, not controls), solid fills darken, and destructive items keep the error tint
- Import environment values from `src/lib/env.ts`; route strings from `src/routes/paths.ts`; nav items from `src/lib/navigation.ts` — no inline `import.meta.env` or path strings
- A constant or validation rule used by more than one component lives in `src/lib/` (`validation.ts` for rules, `options.ts` for selects) and is imported — never re-typed per form, because the copies drift and the messages stop matching
- Class names render `1-A` via `classLabel` / `classLabelFor` (`src/data/classes.ts`) — never concatenate a grade and section by hand
- Select options come from a domain type or from the API: `lib/options.ts` lists are checked against their union with `satisfies` (so adding a member to a type without offering it is a compile error), and record lists come from a hook (`useClassOptions`, `useSubjectOptions`). Never hardcode a subject, class or status list inside a form
- Feature `api.ts` modules are the only callers of `src/services/apiClient.ts`; every request goes through it so the mock adapter, JWT attach and error envelope apply consistently
- Prettier + ESLint: run `npm run lint` and `npm run typecheck` before finishing any task

## Avoid

- New UI libraries (no MUI, Chakra, Ant Design, shadcn full-install)
- CSS-in-JS or styled-components — Tailwind only
- Fetching data directly inside components — go through `src/services/` or TanStack Query hooks in a feature `api.ts`
- `useEffect` + `useState` fetch/loading/error patterns where TanStack Query covers the case
- Hand-rolled form state (`useState` per field) or ad-hoc validation functions where react-hook-form owns the form
- Reaching into `src/data/` from a component — demo data is served through the axios mock adapter so the query hooks stay unchanged when the backend lands
- Hardcoding a route (`to="/login"`) — use `paths` from `src/routes/paths.ts`
- Over-abstracting one-off helpers into shared utilities
- Editing files outside the requested scope
- Hardcoded colors — use palette tokens from `docs/frontend/Design.md`

## AI boundaries

- Read `docs/frontend/PRD.md`, `Architecture.md`, and `Design.md` before implementing features
- Do not install packages without explicit approval
- Follow `docs/frontend/Phases.md` — complete one phase before starting the next
- Never commit unless asked
- Match existing component conventions before introducing new patterns
- Minimize diff size — smallest correct change wins

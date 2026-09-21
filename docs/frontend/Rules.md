# Rules — Frontend

## Use

- Tailwind utility classes with theme tokens from `src/styles/index.css`
- `cn()` from `src/lib/cn.ts` for conditional classes
- `lucide-react` for all icons
- Recharts for all charts — never mix in another chart library
- Function components + hooks; TypeScript strict types for all props and API data
- Design-system primitives from `src/components/ui/` before writing one-off markup
- Prettier + ESLint: run `npm run lint` and `npm run typecheck` before finishing any task

## Avoid

- New UI libraries (no MUI, Chakra, Ant Design, shadcn full-install)
- CSS-in-JS or styled-components — Tailwind only
- Fetching data directly inside components — go through `src/services/` or feature `api.ts`
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

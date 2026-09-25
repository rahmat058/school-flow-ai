# Design — Frontend

Visual language for School Flow AI: editorial, quietly confident, high information density with breathing room. Design tokens live in `src/styles/index.css` (Tailwind 4 theme).

## Colors

- **Primary** `#6366F1` (indigo) — CTAs, active states, links, focus rings, interactive highlights only
- **Primary Hover** `#4F46E5` — hover on primary elements
- **Neutral** `#9C9C9C` — muted text, placeholders, disabled states
- **Background** `#FAFAFA` — page background
- **Surface** `#FFFFFF` — cards, panels, modals, sidebar
- **Text Primary** `#0A0A0A` — headings, body
- **Text Secondary** `#6B6B6B` — descriptions, metadata
- **Border** `#E8E8EC` — card borders, dividers, inputs
- **Success** `#10B981` — paid, present, published
- **Warning** `#F59E0B` — pending fees, leave status
- **Error** `#EF4444` — absent, destructive actions, validation errors
- **Stat-card gradients** — one light→deep pair per tone, tokens in `src/styles/index.css` and used by `StatCard` alone: primary `#818CF8→#4F46E5`, success `#34D399→#047857`, warning `#FBBF24→#B45309`, error `#F87171→#B91C1C`. The deep stop is dark enough to carry white text on every tone.

## Fonts

- **Display:** General Sans (Fontshare) — headings, stat numbers
- **Body:** DM Sans (Google Fonts) — UI text
- **Code:** JetBrains Mono — IDs, receipts, code

## Typography

- h1: 32px, bold, tracking -0.03em, display font
- h2 (section): 24px, semibold, display font
- Subhead: 18–20px, medium
- Body: 15px, regular/medium, leading relaxed
- Small: 13px · Caption: 12px · Overline: 11px uppercase, tracking wide
- Never more than two font weights on one screen

## Components

- **Buttons:** primary = indigo fill, white text, 6px radius; secondary = transparent + 1px border; ghost = text-only hover; destructive = red. Sizes: 32 / 38 / 44px. Lift 1px on hover.
- **Cards:** white surface, 1px border, 12px radius, flat at rest; hover lifts 2px with `0 8px 30px rgba(0,0,0,0.08)`. Transition 200ms.
- **Key-metric cards:** a **gradient fill in the metric's tone** (light left → deep right), with the label in `white/80`, the value in the display font at `white`, and the icon in a **translucent white circle** at the trailing edge — the fill carries the meaning, so nothing else on the card needs colour. A trend caption keeps white text and lets the up/down **arrow** give the direction; a metric with no better-or-worse reading shows a plain `white/80` caption. Every route's KPI row uses this one treatment (`StatCard`, and the tiles on reports, attendance, timetable, fees and a student's profile), driven by the shared `statGradientStyles`/`statCardShell`/`statMarkStyles` in `src/lib/statTone.ts`.
- **Inputs:** 1px border, 6px radius, 10×14 padding, 14px text; focus = indigo border + 3px indigo ring; error = red border.
- **Badges/chips:** pill shape, 12px text; semantic colors for status (success/warning/error).
- **Classifying tags:** a chip that _classifies_ a record (a material's type, subject and class) uses a **hard fill with white text** — indigo, the palette's green (`secondary`) and a hard neutral (`ink-muted`). The `-soft` tints sit within a few percent of white and read as nothing at this size, so they stay for status, where the text colour carries the meaning. A tag is a label, not a control, and never borrows the status vocabulary.
- **Count badges:** a count bubble — the header bell's unread badge, and the record size beside a tab label — is a **solid fill with white text**, 10px, `min-w-4` and centred. One `CountBadge` component renders every one of them, so a tab badge matches the bell by construction; at this size the `-soft` tints are invisible. A tone carries meaning where there is any (the bell ramps primary → warning → error as the backlog grows) and is otherwise a calm accent. The badge's digits are tabular and never wrap; `99+` caps a long count.
- **Tables:** stacked rows, 1px dividers, 12×16 cell padding, row hover uses the shared `bg-primary-soft` tint. A roster row opens with an avatar plus the name and a muted identifier beneath; numeric columns are tabular; a share (attendance, progress) draws as a slim tinted bar with its percentage beside it — the bar is **left-anchored with its value after it**, never inside a right-aligned cell, because a right-anchored track reads as filling backwards; state renders as a status pill.
- **Charts (motion):** every series **animates in** on entry — `isAnimationActive` with `animationDuration: 800`, via the shared `chartAnimation` in `src/lib/chart.ts` spread onto each series. Recharts animates when a series mounts, and a route change remounts the tree, so a route's charts draw themselves in **every time** you land on it, not only on a first visit. 800ms, not Recharts' 1500ms default: the page is already on screen, so the entrance is a flourish, not a load. A series that is switched off (`isAnimationActive={false}`) is a bug, not a style choice.
- **Hover (interactive):** `bg-primary-soft` + `text-primary` is _the_ hover treatment — buttons (secondary/ghost), nav items, icon buttons, pagination, accordion triggers, menu items and select-option highlights all use it. Table rows take the tint only (their text stays ink — they are data, not controls). Solid fills darken instead (`primary-hover` / `error/90`), and destructive menu items keep the error tint.
- **Auth screens:** a split layout — a brand panel (384–420px) on the left from `lg` and one narrow form column (max 448px) on the right, both on surface/canvas tones with no decorative indigo; below `lg` the panel is dropped and the wordmark repeats above the form. Login adds a 2×2 role picker under the CTA, a "Signing in as …" status pill above it, and a role-named submit button.
- **Dashboard:** four stacked rows — a 4-up stat row; two charts side by side from `xl` (attendance line + fee bar); class performance beside a recent-activity list; then upcoming exams, pending fees and the school calendar at a third each. The **stat cards are filled** in their metric's tone (see Components) — colour marks meaning (success = healthy, error = overdue or pending debt, warning = due soon, primary = counts and dates), never decoration — while every other card on the page stays a neutral surface with a single tinted icon chip. A KPI shows a real number or an honest empty state — never a dash placeholder.
- **Panels & menus:** creating or editing a record opens a right-side **sheet** (max 448px) that slides in over the page; a record's _full_ detail is a route instead (`/students/:id`) with the sections behind tabs. Row-level actions live behind a trailing ellipsis menu whose header is right-aligned with the column, and anything destructive passes through a confirm dialog before it runs. Forms pair related fields on one row (first/last name, class/roll, name/phone) and give long text its own full-width row.
- **Toasts:** stack from the **top right**, newest last, with the semantic tint of their tone and a live region so they are announced. Nothing else uses that corner. The motion is react-toastify's: entrance and exit **bounce** in from / out to the right (a brief overshoot and recoil), an auto-dismissing toast carries a thin tone-coloured **countdown bar** along its bottom edge, hovering **pauses** the countdown, and a toast can be **swiped away** sideways.
- **Wide tables:** a table inside a card must fit the card — trim padding and merge paired columns (e.g. `13 / 20`) rather than letting the page scroll sideways; if a table still overflows on a narrow viewport the scrollbar stays inside its own container. Scrollable strips (the profile tab bar) hide their scrollbar entirely and stay swipable.
- **Record tabs:** each tab opens with a title, a one-line description and its own action on the right — a `Download … PDF` where a sheet makes sense. When there is nothing to export the action disables itself and explains why in its tooltip, rather than disappearing.
- **Card grids:** a collection of people (teachers) reads as cards, not table rows — avatar, name, identifier, one accent chip for the primary attribute, neutral chips for the rest, then contact lines with icons. A table stays the right shape for records you compare numerically (students, invoices).
- **Timetable:** a days × periods grid in a card, scrolling inside its own container on narrow viewports. The **TIME column** carries a soft per-row gradient wash (the palette's soft tints, cycling row by row) with the row label over its times — the one place in the app where a gradient is allowed, because it is what makes a row readable across six columns. Day headers mark today in primary. A **legend** of the class's subjects sits above the grid, and each subject's soft tint is reused by its cells; a lesson is a tinted block (subject over teacher) that lifts on hover and opens the entry editor, an empty period is a dashed muted cell, and breaks span the week as a flat strip. Read-only roles get the same grid with no edit affordances and no hover lift.
- **Nav:** sidebar 240px, collapsing to a 76px icon rail on desktop and sliding in as a drawer on mobile; header 64px (72px on desktop) with backdrop-blur; the sidebar is viewport-pinned, so only the main column scrolls. The header states the **school**, not the signed-in person — a neutral chip with a building mark and the school's name sits before the account avatar, and the avatar's own menu carries the name (there is one school to be in, so the chip is a label rather than a switcher). A collapsed rail is icon-only, so **every heading it hides comes back on hover** as a `Tooltip`: the school at the top, each nav item's label, and the account at the foot.
- **Currency:** amounts are stored as integer minor units and displayed in **USD** (`$1,500.00`) — see `src/lib/format.ts`
- **Scrollbars:** thin and neutral (`--color-scrollbar-thumb`, darkening on hover), defined once globally in `src/styles/index.css` — a 4px pill via the WebKit pseudo-elements, `scrollbar-width: thin` for Firefox. Don't set `scrollbar-width`/`scrollbar-color` anywhere else: Chrome ignores `::-webkit-scrollbar` entirely as soon as either is set.
- **Focus:** 3px indigo ring `0 0 0 3px rgba(99,102,241,0.12)`.

## Spacing & radius

- 4px base grid: 4, 8, 12, 16, 20, 24, 32, 48, 64
- Section spacing: 32 mobile / 48 tablet / 64 desktop
- Container: the `page-container` utility (1280px max, centred, 16px inline padding rising to 32px from `lg`) — the single wrapper for main content, never re-declared per page
- Radius: 4px chips · 6px buttons/inputs · 8px panels · 12px cards · full for avatars/status dots

## Do's and Don'ts

- Do use indigo only for interactive elements
- Do keep the 4px spacing grid everywhere
- Do keep cards at 12px and buttons/inputs at 6px radius — don't mix
- Don't use pure black/white for text — use palette values. White is the one exception, and only where text sits on a **saturated fill**: a primary or destructive button, and a stat card.
- Don't add gradients or decorative illustrations. Two exceptions, both for wayfinding rather than ornament: the **timetable's TIME column** (a soft per-row wash, so a row reads across six columns) and the **stat-card fill**, whose gradient carries the metric's tone.
- Don't use shadows on static elements — shadows are for hover/focus only
- Don't invent new hover backgrounds — interactive hover is `bg-primary-soft`, everywhere
- Don't place more than one primary button per view section

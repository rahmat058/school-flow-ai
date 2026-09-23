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
- **Stat cards:** label (overline) + value (display font) + delta badge.
- **Inputs:** 1px border, 6px radius, 10×14 padding, 14px text; focus = indigo border + 3px indigo ring; error = red border.
- **Badges/chips:** pill shape, 12px text; semantic colors for status (success/warning/error).
- **Tables:** stacked rows, 1px dividers, 12×16 cell padding, row hover uses the shared `bg-primary-soft` tint
- **Hover (interactive):** `bg-primary-soft` + `text-primary` is _the_ hover treatment — buttons (secondary/ghost), nav items, icon buttons, pagination, accordion triggers, menu items and select-option highlights all use it. Table rows take the tint only (their text stays ink — they are data, not controls). Solid fills darken instead (`primary-hover` / `error/90`), and destructive menu items keep the error tint.
- **Auth screens:** a split layout — a brand panel (384–420px) on the left from `lg` and one narrow form column (max 448px) on the right, both on surface/canvas tones with no decorative indigo; below `lg` the panel is dropped and the wordmark repeats above the form. Login adds a 2×2 role picker under the CTA, a "Signing in as …" status pill above it, and a role-named submit button.
- **Nav:** sidebar 240px, collapsing to a 76px icon rail on desktop and sliding in as a drawer on mobile; header 64px (72px on desktop) with backdrop-blur; the sidebar is viewport-pinned, so only the main column scrolls
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
- Don't use pure black/white for text — use palette values
- Don't add gradients or decorative illustrations
- Don't use shadows on static elements — shadows are for hover/focus only
- Don't invent new hover backgrounds — interactive hover is `bg-primary-soft`, everywhere
- Don't place more than one primary button per view section

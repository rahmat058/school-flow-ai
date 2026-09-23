/**
 * Brand assets. Files live in `public/`, so they are referenced by URL and served as-is by Vite.
 * Swap the two paths here to change the artwork everywhere at once.
 *
 * Sizing note — `wordmark` (`school-flow.png`) is a 2172×724 canvas whose artwork only occupies
 * 1979×430, i.e. ~40% of its height is transparent padding, and its content ratio is 4.6:1. Size it
 * with a box at that ratio (`h-14 w-65`) and `object-cover` to crop the padding out; `h-* w-auto`
 * renders the wordmark much smaller than it looks. Trimming the PNG (or dropping in an SVG) would
 * remove the need for that trick — recommended, since the file is also 416 KB.
 *
 * The crop only engages while the box is wider than the artwork's 4.6:1 ratio: at `h-14` that means
 * `w-64` (256px) or wider. A narrower box still shows the artwork, but its ~40% vertical padding
 * comes back, so the mark renders smaller than the box suggests.
 *
 * The sidebar no longer uses an image (it renders a lucide `School` icon chip), so
 * `public/mobile-logo.png` — 1254×1254, no alpha, 1.7 MB — is currently unreferenced. Delete it or
 * repurpose it as the app icon.
 */
export const BRAND = {
  name: 'School Flow AI',
  /** Full wordmark — the auth screens. */
  wordmark: '/school-flow.png',
} as const

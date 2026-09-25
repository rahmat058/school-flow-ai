import { useEffect } from 'react'
import { BRAND } from '@/lib/brand'
import { navItems } from '@/lib/navigation'

/**
 * The label for a route, taken from the nav so the tab and the sidebar can never disagree.
 *
 * Longest prefix wins, so `/students/42` reads as Students rather than matching something shorter,
 * and `/` only matches itself. A role is honoured where the nav distinguishes one: `/exams` is
 * "Tests & exams" for staff and students but "Results" for a guardian, and a guardian should not
 * get a tab named after a screen they cannot open. Returns null when nothing matches, which the
 * hook reads as "just the brand".
 */
export function routeTitleFor(pathname: string, role?: string): string | null {
  const match = navItems
    .filter((item) => !role || (item.roles as readonly string[]).includes(role))
    .filter((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]

  return match?.label ?? null
}

/**
 * Keeps the browser tab in step with the route: `Students · School Flow AI`.
 *
 * Every authenticated page goes through `AppShell` and every public one through `AuthShell`, so
 * two call sites cover the app. Pass null/undefined where a route has no name of its own — the tab
 * falls back to the bare brand rather than leaking the previous page's title.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : BRAND.name
  }, [title])
}

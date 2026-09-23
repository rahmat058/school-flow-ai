import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { useSessionBootstrap } from '@/features/auth/api'
import { RouteFallback } from '@/routes/RouteFallback'
import { privateRoutes } from '@/routes/privateRoutes'
import { publicRoutes } from '@/routes/publicRoutes'

/**
 * Public and private route groups composed in one place. Pages are lazy-loaded, so the top-level
 * `Suspense` covers the first load; `AppShell` adds its own boundary so in-app navigation keeps the
 * sidebar and header on screen while a page chunk downloads.
 */
export function AppRoutes() {
  useSessionBootstrap()
  const element = useRoutes([...publicRoutes, ...privateRoutes])

  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>
}

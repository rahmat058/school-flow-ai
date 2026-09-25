import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui/Spinner'
import { routeTitleFor, useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCurrentUser } from '@/store/auth'

export function AppShell() {
  // Small screens: an overlay drawer. Large screens: a rail that can collapse to icons only.
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)

  const { pathname } = useLocation()
  const user = useCurrentUser()

  // The tab names the page you are on, resolved from the nav so the two always agree.
  useDocumentTitle(routeTitleFor(pathname, user?.role))

  return (
    <div className="bg-canvas flex min-h-screen">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} collapsed={railCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          sidebarCollapsed={railCollapsed}
          onToggleSidebar={() => setRailCollapsed((collapsed) => !collapsed)}
        />
        <main className="flex-1">
          <div className="page-container py-6 lg:py-8">
            {/* Own boundary so a lazily-loaded page does not unmount the shell. */}
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <Spinner size="lg" label="Loading page" />
    </div>
  )
}

import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Spinner } from '@/components/ui/Spinner'

export function AppShell() {
  // Small screens: an overlay drawer. Large screens: a rail that can collapse to icons only.
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false)

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

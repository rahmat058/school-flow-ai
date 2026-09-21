import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { navItems } from '@/data/dashboard'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const current = navItems.find((item) => (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)))

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={current?.label ?? 'Dashboard'} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1280px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

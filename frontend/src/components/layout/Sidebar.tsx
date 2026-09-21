import { NavLink } from 'react-router-dom'
import { navItems } from '@/data/dashboard'
import { cn } from '@/lib/cn'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'bg-ink/20 fixed inset-0 z-30 backdrop-blur-[2px] transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'border-line bg-surface fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}>
        <div className="px-6 pt-7 pb-8">
          <p className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Curator Pro</p>
          <p className="text-ink-subtle mt-0.5 text-[13px]">SaaS Analytics</p>
        </div>

        <nav className="flex-1 space-y-1" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'relative mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors',
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-canvas hover:text-ink',
                  )
                }>
                {({ isActive }) => (
                  <>
                    <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="bg-primary absolute inset-y-1.5 -right-3 w-[3px] rounded-l-full" />
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto space-y-5 px-4 pt-4 pb-6">
          <button
            type="button"
            className="from-primary to-primary-hover flex h-[38px] w-full items-center justify-center rounded-md bg-gradient-to-r text-[14px] font-medium text-white transition-all duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-primary)]">
            Upgrade Plan
          </button>

          <div className="flex items-center gap-3 px-1">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80"
              alt="Alex Rivera"
              className="size-9 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-ink truncate text-[14px] font-medium">Alex Rivera</p>
              <p className="text-ink-subtle text-[12px]">Pro Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

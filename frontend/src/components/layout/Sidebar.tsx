import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import { navItemsForRole } from '@/lib/navigation'
import { useCurrentUser } from '@/store/auth'
import { useLogout } from '@/features/auth/api'
import { useCurrentSchool } from '@/features/school/api'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useCurrentUser()
  const school = useCurrentSchool()
  const logout = useLogout()
  const items = navItemsForRole(user?.role)

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
        <div className="px-6 pt-7 pb-6">
          <p className="font-display text-ink text-[18px] leading-tight font-semibold tracking-[-0.03em]">
            {school.data?.name ?? 'School Flow AI'}
          </p>
          <p className="text-ink-subtle mt-1 text-[12px]">
            {school.data ? `Academic year ${school.data.settings.academicYear}` : 'School management'}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pb-4" aria-label="Primary">
          {items.map((item) => {
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

        <div className="border-line mt-auto border-t px-4 py-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-[13px] font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-ink-subtle text-[11px]">{humanizeEnum(user.role)}</p>
              </div>
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                aria-label="Sign out"
                title="Sign out"
                className="text-ink-subtle hover:bg-canvas hover:text-ink inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors">
                <LogOut className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}

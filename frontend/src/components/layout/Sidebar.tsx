import { NavLink } from 'react-router-dom'
import { LogOut, School } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { BRAND } from '@/lib/brand'
import { cn } from '@/lib/cn'
import { humanizeEnum } from '@/lib/format'
import { navItemsForRole } from '@/lib/navigation'
import { useCurrentUser } from '@/store/auth'
import { useLogout } from '@/features/auth/api'
import { useCurrentSchool } from '@/features/school/api'

interface SidebarProps {
  open: boolean
  onClose: () => void
  /** Desktop rail mode: 240px ↔ 76px, labels collapse away. */
  collapsed: boolean
}

export function Sidebar({ open, onClose, collapsed }: SidebarProps) {
  const user = useCurrentUser()
  const school = useCurrentSchool()
  const logout = useLogout()
  const items = navItemsForRole(user?.role)

  const schoolName = school.data?.name ?? BRAND.name
  const schoolMeta = school.data ? `Academic year ${school.data.settings.academicYear}` : 'School management'

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
          // Mobile: an overlay drawer that slides in. Desktop: a viewport-height rail that stays
          // pinned while the main column scrolls, so the account block never scrolls out of view.
          'border-line bg-surface fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r',
          'transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          collapsed ? 'lg:w-19' : 'lg:w-60',
          open ? 'translate-x-0' : '-translate-x-full',
        )}>
        <div
          className={cn(
            'flex items-center gap-3 pt-7 pb-6 transition-[padding] duration-200 ease-out',
            collapsed ? 'lg:justify-center lg:px-3' : 'lg:px-6',
          )}>
          <span
            aria-hidden="true"
            className="bg-primary-soft text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <School className="size-4.5" strokeWidth={1.75} />
          </span>

          <div
            className={cn(
              'min-w-0 overflow-hidden transition-[max-width,opacity] duration-200 ease-out',
              collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-42 lg:opacity-100',
            )}>
            <p className="font-display text-ink truncate text-[16px] leading-tight font-semibold tracking-[-0.03em]">
              {schoolName}
            </p>
            <p className="text-ink-subtle mt-1 truncate text-[12px]">{schoolMeta}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain pb-4" aria-label="Primary">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Tooltip key={item.href} content={item.label} side="right" disabled={!collapsed} className="block w-full">
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'relative mx-3 flex items-center rounded-lg py-2.5 text-[14px] font-medium transition-colors',
                      collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : 'lg:gap-3 lg:px-3',
                      isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-canvas hover:text-ink',
                    )
                  }>
                  {({ isActive }) => (
                    <>
                      <Icon className="size-4.5 shrink-0" strokeWidth={1.75} />
                      {/* Kept in the DOM when collapsed so the link still has an accessible name. */}
                      <span
                        className={cn(
                          'truncate transition-[max-width,opacity] duration-200 ease-out',
                          collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-35 lg:opacity-100',
                        )}>
                        {item.label}
                      </span>
                      {isActive ? (
                        <span className="bg-primary absolute inset-y-1.5 -right-3 w-0.75 rounded-l-full" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              </Tooltip>
            )
          })}
        </nav>

        <div
          className={cn(
            'border-line mt-auto border-t py-4 transition-[padding] duration-200 ease-out',
            collapsed ? 'lg:px-2' : 'lg:px-4',
          )}>
          {user ? (
            <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center lg:gap-2')}>
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
              <div
                className={cn(
                  'min-w-0 flex-1 overflow-hidden transition-[max-width,opacity] duration-200 ease-out',
                  collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-37.5 lg:opacity-100',
                )}>
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

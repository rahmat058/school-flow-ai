import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CircleHelp, LogOut, Megaphone, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DropdownItemConfig } from '@/components/ui/Dropdown'
import { useToast } from '@/hooks/useToast'
import { paths } from '@/routes/paths'
import { useCurrentUser } from '@/store/auth'
import { useLogout } from '@/features/auth/api'

interface HeaderProps {
  title: string
  onMenuClick: () => void
  /** Desktop rail state — ignored on small screens, where the sidebar is a drawer instead. */
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function Header({ title, onMenuClick, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const user = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const { toast } = useToast()

  const menuItems: DropdownItemConfig[] = [
    {
      id: 'notices',
      label: 'Notices',
      icon: Megaphone,
      onSelect: () => navigate(paths.notices),
    },
    {
      id: 'sign-out',
      label: 'Sign out',
      icon: LogOut,
      danger: true,
      separatorBefore: true,
      onSelect: () => {
        logout.mutate(undefined, {
          onSettled: () => toast({ tone: 'info', title: 'Signed out' }),
        })
      },
    },
  ]

  return (
    <header className="border-line bg-surface/90 sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-md lg:h-[72px] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="text-ink-muted hover:bg-canvas hover:text-ink inline-flex size-9 items-center justify-center rounded-md lg:hidden"
          aria-label="Open navigation">
          <Menu className="size-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          aria-pressed={sidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-ink-muted hover:bg-canvas hover:text-ink hidden size-9 items-center justify-center rounded-md transition-colors lg:inline-flex">
          {/* Crossfade rather than a hard icon swap, so the toggle reads as one control. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={sidebarCollapsed ? 'expand' : 'collapse'}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="inline-flex">
              {sidebarCollapsed ? (
                <PanelLeftOpen className="size-[18px]" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="size-[18px]" strokeWidth={1.75} />
              )}
            </motion.span>
          </AnimatePresence>
        </button>

        <label className="relative w-full max-w-[380px]">
          <Search
            className="text-ink-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search students, invoices, notices..."
            className="bg-canvas text-ink placeholder:text-ink-subtle focus:border-primary focus:bg-surface h-10 w-full rounded-full border border-transparent pr-4 pl-10 text-[14px] transition-colors"
          />
        </label>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="text-ink-muted hover:bg-canvas hover:text-ink inline-flex size-9 items-center justify-center rounded-md"
          aria-label="Notifications"
          title="Notifications">
          <Bell className="size-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="text-ink-muted hover:bg-canvas hover:text-ink inline-flex size-9 items-center justify-center rounded-md"
          aria-label="Help"
          title="Help">
          <CircleHelp className="size-[18px]" strokeWidth={1.75} />
        </button>

        <span className="bg-line mx-2 hidden h-6 w-px sm:block" />

        <p className="text-ink hidden max-w-[160px] truncate text-[14px] font-medium sm:block">
          {user ? `${user.firstName} ${user.lastName}` : title}
        </p>

        {user ? (
          <Dropdown
            items={menuItems}
            triggerLabel={`Account menu for ${user.firstName} ${user.lastName}`}
            trigger={<Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />}
          />
        ) : null}
      </div>
    </header>
  )
}

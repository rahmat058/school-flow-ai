import { Bell, CircleHelp, Menu, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:h-[72px] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <label className="relative w-full max-w-[380px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search analytics..."
            className="h-10 w-full rounded-full border border-transparent bg-canvas pr-4 pl-10 text-[14px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
          aria-label="Help"
          title="Help"
        >
          <CircleHelp className="size-[18px]" strokeWidth={1.75} />
        </button>
        <span className="mx-2 hidden h-6 w-px bg-line sm:block" />
        <p className="hidden text-[15px] font-medium text-primary sm:block">
          {title}
        </p>
      </div>
    </header>
  )
}

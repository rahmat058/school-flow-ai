import { Bell, CircleHelp, Menu, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="border-line bg-surface/90 sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b px-4 backdrop-blur-md lg:h-[72px] lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="text-ink-muted hover:bg-canvas hover:text-ink inline-flex size-9 items-center justify-center rounded-md lg:hidden"
          aria-label="Open navigation">
          <Menu className="size-5" />
        </button>

        <label className="relative w-full max-w-[380px]">
          <Search
            className="text-ink-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search analytics..."
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
        <p className="text-primary hidden text-[15px] font-medium sm:block">{title}</p>
      </div>
    </header>
  )
}

import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { paths } from '@/routes/paths'

export function NotFoundPage() {
  return (
    <section className="border-line bg-surface rounded-xl border p-10 text-center">
      <p className="font-display text-primary text-[11px] font-medium tracking-[0.16em] uppercase">404</p>
      <h1 className="font-display text-ink mt-2 text-[32px] font-semibold tracking-[-0.03em]">Page not found</h1>
      <p className="text-ink-muted mx-auto mt-3 max-w-md text-[15px]">
        The page you asked for does not exist, or your role does not have access to it.
      </p>

      <div className="mt-6 flex justify-center">
        <Link to={paths.dashboard}>
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </section>
  )
}

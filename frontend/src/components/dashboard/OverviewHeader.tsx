import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCurrentUser } from '@/store/auth'
import { useCurrentSchool } from '@/features/school/api'

/** Greets the signed-in user and surfaces the term's headline number. */
export function OverviewHeader() {
  const user = useCurrentUser()
  const school = useCurrentSchool()

  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-display text-primary text-[11px] font-medium tracking-[0.16em] uppercase">
          {school.data ? `${school.data.settings.academicYear} Academic Year` : 'Overview'}
        </p>
        <h1 className="font-display text-ink mt-2 text-[32px] leading-none font-semibold tracking-[-0.03em]">
          Welcome back, {user?.firstName ?? 'there'}.
        </h1>
        <p className="text-ink-muted mt-3 text-[15px]">
          Fee collection is <span className="text-success font-medium">12.4% ahead</span> of last term, with 6 invoices
          overdue.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary">
          <Download className="size-4" strokeWidth={1.75} />
          Export report
        </Button>
        <Button>
          <Plus className="size-4" strokeWidth={1.75} />
          Collect fee
        </Button>
      </div>
    </section>
  )
}

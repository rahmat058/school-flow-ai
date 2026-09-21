import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function OverviewHeader() {
  return (
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-display text-[11px] font-medium tracking-[0.16em] text-primary uppercase">
          Executive Overview
        </p>
        <h1 className="mt-2 font-display text-[32px] leading-none font-semibold tracking-[-0.03em] text-ink">
          Welcome back, Alex.
        </h1>
        <p className="mt-3 text-[15px] text-ink-muted">
          Your MRR has increased by{' '}
          <span className="font-medium text-success">12.4%</span> this month.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary">
          <Download className="size-4" strokeWidth={1.75} />
          Export Report
        </Button>
        <Button>
          <Plus className="size-4" strokeWidth={1.75} />
          Create New View
        </Button>
      </div>
    </section>
  )
}

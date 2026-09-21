import { Sparkles } from 'lucide-react'

export function InsightsCard() {
  return (
    <article className="flex h-full flex-col justify-between rounded-xl bg-primary p-6 text-white">
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase">
          <Sparkles className="size-3.5" strokeWidth={1.75} />
          New Insights
        </p>
        <h2 className="mt-4 font-display text-[24px] leading-tight font-semibold tracking-[-0.03em]">
          Identify High-Churn Risk Segments
        </h2>
        <p className="mt-4 text-[14px] leading-relaxed text-white/80">
          Our AI detected unusual usage patterns in your Starter plan. 14% of
          those accounts show early cancellation signals for next month.
        </p>
      </div>

      <button
        type="button"
        className="mt-8 flex h-[38px] w-full items-center justify-center rounded-md bg-white text-[14px] font-medium text-primary transition-all duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-primary)]"
      >
        View Smart Analysis
      </button>
    </article>
  )
}

import type { ReactNode } from 'react'

/** A titled card panel — the profile screens' section wrapper, matching the dashboard cards. */
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** One label/value pair in a definition grid. */
export function PanelField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-muted text-[13px]">{label}</dt>
      <dd className="text-ink mt-0.5 text-[14px] break-words">{value}</dd>
    </div>
  )
}

import type { ReactNode } from 'react'

/** A panel wrapper shared by the profile tabs, matching the dashboard cards. */
export function StudentPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** One label/value pair in a definition grid. */
export function StudentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-muted text-[13px]">{label}</dt>
      <dd className="text-ink mt-0.5 text-[14px] break-words">{value}</dd>
    </div>
  )
}

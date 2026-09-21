interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="rounded-xl border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
      <p className="font-display text-[11px] font-medium tracking-[0.16em] text-primary uppercase">Coming Soon</p>
      <h1 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.03em] text-ink">{title}</h1>
      <p className="mt-3 max-w-xl text-[15px] text-ink-muted">{description}</p>
    </section>
  )
}

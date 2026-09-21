interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="border-line bg-surface rounded-xl border p-8 shadow-[var(--shadow-card)]">
      <p className="font-display text-primary text-[11px] font-medium tracking-[0.16em] uppercase">Coming Soon</p>
      <h1 className="font-display text-ink mt-2 text-[32px] font-semibold tracking-[-0.03em]">{title}</h1>
      <p className="text-ink-muted mt-3 max-w-xl text-[15px]">{description}</p>
    </section>
  )
}

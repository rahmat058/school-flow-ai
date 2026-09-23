import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChartPoint } from '@/types/dashboard'

interface ClassPerformanceChartProps {
  /** One point per class. `value` is the class average as a percentage. */
  performance: ChartPoint[]
}

/**
 * Class averages from the recorded results. The y axis stays visible here, unlike the fee chart:
 * these values are percentages on a fixed 0–100 scale, so the ticks mean something.
 */
export function ClassPerformanceChart({ performance }: ClassPerformanceChartProps) {
  const weakest = performance.reduce<ChartPoint | null>(
    (low, point) => (!low || point.value < low.value ? point : low),
    null,
  )

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Class performance</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Average marks per class, across recorded results</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performance} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              width={32}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null

                return (
                  <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                    <p className="text-ink-muted">Class {payload[0].payload.label}</p>
                    <p className="text-ink font-medium">{Number(payload[0].value)}% average</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="value" maxBarSize={36} radius={[6, 6, 0, 0]} fill="#6366F1" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-ink-subtle mt-4 text-[12px]">
        {weakest ? `Lowest average is ${weakest.label} at ${weakest.value}%.` : 'No results recorded yet.'}
      </p>
    </article>
  )
}

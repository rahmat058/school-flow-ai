import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/cn'
import { formatPaise } from '@/lib/format'
import type { ChartPoint } from '@/types/dashboard'

type Period = 'monthly' | 'quarterly'

const periods: Array<{ id: Period; label: string }> = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
]

interface TrendBarProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: { label: string }
  highlightLabel: string
}

function TrendBar({ x = 0, y = 0, width = 0, height = 0, payload, highlightLabel }: TrendBarProps) {
  if (width <= 0 || height <= 0) return null

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={6}
      fill={payload?.label === highlightLabel ? '#6366F1' : '#E2E2E8'}
    />
  )
}

interface CollectionChartProps {
  monthly: ChartPoint[]
  quarterly: ChartPoint[]
  highlightedMonth: string
}

/** Fee collection over time. Values arrive in paise and are formatted at the edge. */
export function CollectionChart({ monthly, quarterly, highlightedMonth }: CollectionChartProps) {
  const [period, setPeriod] = useState<Period>('monthly')

  const data = period === 'monthly' ? monthly : quarterly
  const peakLabel = useMemo(
    () =>
      period === 'monthly'
        ? highlightedMonth
        : data.reduce((high, point) => (point.value > high.value ? point : high)).label,
    [data, period, highlightedMonth],
  )

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Fee collection</h2>
          <p className="text-ink-muted mt-1 text-[13px]">Collected across the last 12 months</p>
        </div>

        <div className="bg-canvas inline-flex rounded-lg p-1">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={cn(
                'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                period === item.id ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:text-ink',
              )}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              dy={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const value = Number(payload[0].value)

                return (
                  <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                    <p className="text-ink-muted">{payload[0].payload.label}</p>
                    <p className="text-ink font-medium">{formatPaise(value)}</p>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              maxBarSize={42}
              isAnimationActive={false}
              activeBar={false}
              shape={(props) => <TrendBar {...props} highlightLabel={peakLabel} />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-ink-subtle mt-4 text-[12px]">Peak month is highlighted. Hover a bar for the exact amount.</p>
    </article>
  )
}

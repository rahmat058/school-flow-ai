import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/cn'
import { highlightedMonth, monthlyTrends, quarterlyTrends } from '@/data/dashboard'
import type { ChartPeriod } from '@/types/dashboard'

const periods: Array<{ id: ChartPeriod; label: string }> = [
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

export function RevenueChart() {
  const [period, setPeriod] = useState<ChartPeriod>('monthly')
  const data = period === 'monthly' ? monthlyTrends : quarterlyTrends
  const peakLabel = useMemo(() => {
    if (period === 'monthly') return highlightedMonth
    return data.reduce((highest, point) => (point.value > highest.value ? point : highest)).label
  }, [data, period])

  return (
    <article className="rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">MRR Trends</h2>
          <p className="mt-1 text-[13px] text-ink-muted">Revenue growth over the last 12 months</p>
        </div>

        <div className="inline-flex rounded-lg bg-canvas p-1">
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
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-lg">
                    <p className="text-ink-muted">{payload[0].payload.label}</p>
                    <p className="font-medium text-ink">${value.toLocaleString()}</p>
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
    </article>
  )
}

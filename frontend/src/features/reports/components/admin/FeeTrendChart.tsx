import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartAnimation } from '@/lib/chart'
import { formatPaiseCompact } from '@/lib/format'
import type { ReportTrendPoint } from '@/types/reports'

interface FeeTrendChartProps {
  title: string
  description: string
  trend: ReportTrendPoint[]
  action?: ReactNode
}

const COLLECTED = '#10B981'
const PENDING = '#F59E0B'

/** Collected against pending, month by month — the same series both the Overview and Finance tabs read. */
export function FeeTrendChart({ title, description, trend, action }: FeeTrendChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">{title}</h2>
          <p className="text-ink-muted mt-1 text-[13px]">{description}</p>
        </div>
        {action}
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} barCategoryGap="24%" barGap={2}>
            <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={48}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              tickFormatter={(value: number) => formatPaiseCompact(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null

                return (
                  <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                    <p className="text-ink-muted">{payload[0].payload.label}</p>
                    <p className="text-success mt-1 font-medium">
                      Collected {formatPaiseCompact(Number(payload[0].value))}
                    </p>
                    <p className="text-warning font-medium">
                      Pending {formatPaiseCompact(Number(payload[1]?.value ?? 0))}
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey="collectedPaise" name="Collected" fill={COLLECTED} radius={[4, 4, 0, 0]} {...chartAnimation} />
            <Bar dataKey="pendingPaise" name="Pending" fill={PENDING} radius={[4, 4, 0, 0]} {...chartAnimation} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LegendItem color={COLLECTED} label="Collected" />
        <LegendItem color={PENDING} label="Pending" />
      </div>
    </article>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-ink-muted inline-flex items-center gap-2 text-[12px]">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden="true" />
      {label}
    </span>
  )
}

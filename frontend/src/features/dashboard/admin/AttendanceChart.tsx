import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartAnimation } from '@/lib/chart'
import type { ChartPoint } from '@/types/dashboard'

interface AttendanceChartProps {
  /** One point per register day, oldest first. */
  trend: ChartPoint[]
}

/** Attendance health over the last register days — the sibling of the fee chart. */
export function AttendanceChart({ trend }: AttendanceChartProps) {
  const average =
    trend.length === 0 ? 0 : Number((trend.reduce((total, point) => total + point.value, 0) / trend.length).toFixed(1))

  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Attendance overview</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Present and late, as a share of each register day</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              dy={8}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              cursor={{ stroke: '#E8E8EC' }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null

                return (
                  <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                    <p className="text-ink-muted">{payload[0].payload.label}</p>
                    <p className="text-ink font-medium">{Number(payload[0].value)}% present</p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              {...chartAnimation}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-ink-subtle mt-4 text-[12px]">Averages {average}% across these days.</p>
    </article>
  )
}

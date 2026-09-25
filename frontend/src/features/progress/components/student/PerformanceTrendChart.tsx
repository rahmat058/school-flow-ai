import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartAnimation } from '@/lib/chart'
import { EXAM_TYPE_LABELS } from '@/lib/options'
import type { ProgressTrendPoint } from '@/types/progress'

interface PerformanceTrendChartProps {
  trend: ProgressTrendPoint[]
}

const PRIMARY = '#6366F1'

/**
 * The student's percentage, assessment by assessment, oldest first. The 0–100 axis stays visible
 * because the scale is fixed and its ticks mean something — a marks share, not money.
 */
export function PerformanceTrendChart({ trend }: PerformanceTrendChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Performance Trend</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Your share of each published assessment.</p>
      </div>

      {trend.length === 0 ? (
        <p className="text-ink-subtle flex h-[300px] items-center justify-center text-[13px]">
          No published results yet — the trend appears once a teacher publishes them.
        </p>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
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
                width={40}
                tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(99, 102, 241, 0.24)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const point = payload[0].payload as ProgressTrendPoint

                  return (
                    <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                      <p className="text-ink font-medium">{point.label}</p>
                      <p className="text-ink-muted text-[12px]">
                        {EXAM_TYPE_LABELS[point.examType]} · {point.date}
                      </p>
                      <p className="text-primary mt-1 font-medium">Score : {point.percentage}%</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                {...chartAnimation}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

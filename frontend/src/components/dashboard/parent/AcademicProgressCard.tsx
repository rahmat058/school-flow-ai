import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ChartPoint } from '@/types/dashboard'

interface AcademicProgressCardProps {
  progress: ChartPoint[]
}

const PRIMARY = '#6366F1'

/**
 * The child's scores, one point per published result, oldest first — the same rows the Recent
 * results list below shows, so the two cannot disagree. The 0–100 axis stays visible because the
 * scale is fixed and its ticks mean something.
 */
export function AcademicProgressCard({ progress }: AcademicProgressCardProps) {
  return (
    <article className="border-line bg-surface flex flex-col rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Academic progress</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Scores across the published assessments</p>
      </div>

      {progress.length === 0 ? (
        <p className="text-ink-subtle flex h-56 items-center justify-center text-[13px]">
          No published results yet — the trend appears once a teacher publishes them.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progress} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
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

                  return (
                    <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                      <p className="text-ink font-medium">{payload[0].payload.label}</p>
                      <p className="text-primary mt-1">Score : {Number(payload[0].value)}%</p>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={PRIMARY}
                strokeWidth={2}
                dot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

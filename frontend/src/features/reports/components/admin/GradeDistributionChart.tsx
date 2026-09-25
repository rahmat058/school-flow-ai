import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { GradeBucket } from '@/types/reports'

interface GradeDistributionChartProps {
  distribution: GradeBucket[]
}

/** How the paper's marks fall across the school's grade bands. */
export function GradeDistributionChart({ distribution }: GradeDistributionChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Grade Distribution</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Students per grade on this paper</p>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={distribution} barCategoryGap="34%">
            <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
            <XAxis
              dataKey="grade"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9C9C9C', fontSize: 11, fontFamily: 'DM Sans' }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
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
                    <p className="text-ink font-medium">Grade {payload[0].payload.grade}</p>
                    <p className="text-ink-muted mt-1">Students : {Number(payload[0].value)}</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="students" maxBarSize={36} radius={[6, 6, 0, 0]} fill="#6366F1" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

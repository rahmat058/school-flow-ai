import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AttendanceReportRow } from '@/types/reports'

interface AttendanceByClassChartProps {
  label: string
  rows: AttendanceReportRow[]
}

/**
 * Attendance share per class. One bar per class, so with twenty classes the chart scrolls inside its
 * own card — the same treatment as the dashboard's class-performance chart. The 0–100 axis stays
 * visible because the scale is fixed and the ticks mean something.
 */
export function AttendanceByClassChart({ label, rows }: AttendanceByClassChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">
          Attendance by Class — {label}
        </h2>
        <p className="text-ink-muted mt-1 text-[13px]">Present and late, as a share of each class's register</p>
      </div>

      <div className="h-[300px] w-full overflow-x-auto">
        <div className="h-full" style={{ minWidth: `${Math.max(rows.length * 44, 320)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
              <XAxis
                dataKey="className"
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
                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null

                  return (
                    <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                      <p className="text-ink font-medium">{payload[0].payload.className}</p>
                      <p className="text-primary mt-1">Attendance : {Number(payload[0].value)}%</p>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="percentage"
                maxBarSize={36}
                radius={[6, 6, 0, 0]}
                fill="#6366F1"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  )
}

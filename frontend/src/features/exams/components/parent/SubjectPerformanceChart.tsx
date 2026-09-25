import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StudentSubjectPerformance } from '@/types/exams'

interface SubjectPerformanceChartProps {
  subjects: StudentSubjectPerformance[]
}

const PRIMARY = '#6366F1'

/** The child's average per subject — the same figures the subject-wise list is built from. */
export function SubjectPerformanceChart({ subjects }: SubjectPerformanceChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-5">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Performance chart</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Average score per subject, across every published paper</p>
      </div>

      {subjects.length === 0 ? (
        <p className="text-ink-subtle flex h-64 items-center justify-center text-[13px]">
          No marks have been published yet.
        </p>
      ) : (
        <div className="h-64 w-full overflow-x-auto">
          <div className="h-full" style={{ minWidth: `${Math.max(subjects.length * 64, 320)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke="#E8E8EC" strokeDasharray="4 4" />
                <XAxis
                  dataKey="subjectName"
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
                        <p className="text-ink font-medium">{payload[0].payload.subjectName}</p>
                        <p className="text-primary mt-1">Average : {Number(payload[0].value)}%</p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="percentage"
                  maxBarSize={44}
                  radius={[6, 6, 0, 0]}
                  fill={PRIMARY}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </article>
  )
}

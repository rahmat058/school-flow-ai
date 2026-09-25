import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { chartAnimation } from '@/lib/chart'
import type { ProgressSubjectRow } from '@/types/progress'

interface SubjectRadarChartProps {
  subjects: ProgressSubjectRow[]
}

const STUDENT = '#6366F1'
const CLASS = '#9C9C9C'

/**
 * The student against their class, one spoke per subject. A short label sits under each spoke, so
 * the chart needs a handful of subjects — a class running eight reads fine, one running twenty
 * would not, which is why the Subject-wise tab carries the full detail.
 */
export function SubjectRadarChart({ subjects }: SubjectRadarChartProps) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-(--shadow-card) lg:p-6">
      <div className="mb-6">
        <h2 className="font-display text-ink text-[20px] font-semibold tracking-[-0.03em]">Student vs Class Average</h2>
        <p className="text-ink-muted mt-1 text-[13px]">Your average against the class, subject by subject.</p>
      </div>

      {subjects.length === 0 ? (
        <p className="text-ink-subtle flex h-[300px] items-center justify-center text-[13px]">
          No subjects to compare yet.
        </p>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subjects} outerRadius="72%">
              <PolarGrid stroke="#E8E8EC" />
              <PolarAngleAxis dataKey="subjectCode" tick={{ fill: '#6B6B6B', fontSize: 11, fontFamily: 'DM Sans' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const row = payload[0].payload as ProgressSubjectRow

                  return (
                    <div className="border-line bg-surface rounded-lg border px-3 py-2 text-[13px] shadow-lg">
                      <p className="text-ink font-medium">{row.subjectName}</p>
                      <p className="text-primary mt-1">You : {row.studentPercentage}%</p>
                      <p className="text-ink-muted">Class : {row.classPercentage}%</p>
                    </div>
                  )
                }}
              />
              <Radar
                name="Class average"
                dataKey="classPercentage"
                stroke={CLASS}
                fill={CLASS}
                fillOpacity={0.12}
                {...chartAnimation}
              />
              <Radar
                name="Student"
                dataKey="studentPercentage"
                stroke={STUDENT}
                fill={STUDENT}
                fillOpacity={0.28}
                {...chartAnimation}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <LegendItem color={STUDENT} label="Student" />
        <LegendItem color={CLASS} label="Class average" />
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

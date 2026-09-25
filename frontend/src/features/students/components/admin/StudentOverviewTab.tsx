import { formatDate } from '@/lib/format'
import { statCardShell, statGradientStyles } from '@/lib/statTone'
import { StudentDetail, StudentPanel } from '@/features/students/components/admin/StudentPanel'
import type { IconTone } from '@/types/dashboard'
import type { StudentProfile } from '@/types/people'

interface StudentOverviewTabProps {
  profile: StudentProfile
}

/** Overview: the headline numbers, then the record itself, then the guardian. */
export function StudentOverviewTab({ profile }: StudentOverviewTabProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Attendance rate" value={`${profile.attendancePercentage}%`} tone="success" />
        <Stat label="Days present" value={String(profile.daysPresent)} tone="primary" />
        <Stat label="Streak days" value={String(profile.streakDays)} tone="primary" />
        <Stat
          label="Days absent"
          value={String(profile.daysAbsent)}
          tone={profile.daysAbsent > 0 ? 'error' : 'primary'}
        />
      </section>

      <StudentPanel title="Student details">
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <StudentDetail label="Student ID" value={profile.admissionNo} />
          <StudentDetail label="Class" value={profile.className} />
          <StudentDetail label="Roll number" value={String(profile.rollNo)} />
          <StudentDetail label="Gender" value={profile.gender ? profile.gender.toLowerCase() : '—'} />
          <StudentDetail label="Blood group" value={profile.bloodGroup ?? '—'} />
          <StudentDetail label="Date of birth" value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—'} />
          <StudentDetail label="Class teacher" value={profile.classTeacherName ?? 'Not assigned'} />
          <StudentDetail label="Home address" value={profile.guardian?.address ?? '—'} />
          <StudentDetail label="Fee status" value={profile.feeStanding.toLowerCase()} />
        </dl>
      </StudentPanel>

      <StudentPanel title="Parent / Guardian">
        {profile.guardian ? (
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <StudentDetail label="Name" value={profile.guardian.name} />
            <StudentDetail
              label="Relation"
              value={profile.guardian.relation ? profile.guardian.relation.toLowerCase() : '—'}
            />
            <StudentDetail label="Phone" value={profile.guardian.phone ?? '—'} />
            <StudentDetail label="Email" value={profile.guardian.email ?? '—'} />
          </dl>
        ) : (
          <p className="text-ink-subtle text-[13px]">No guardian on record.</p>
        )}
      </StudentPanel>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: IconTone }) {
  return (
    <article className={`${statCardShell} ${statGradientStyles[tone]}`}>
      <p className="text-[13px] text-white/80">{label}</p>
      <p className="font-display mt-2 text-[26px] leading-none font-semibold tracking-[-0.03em] text-white">{value}</p>
    </article>
  )
}

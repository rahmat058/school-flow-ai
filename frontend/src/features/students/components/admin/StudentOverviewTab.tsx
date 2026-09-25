import { formatDate } from '@/lib/format'
import { StudentDetail, StudentPanel } from '@/features/students/components/admin/StudentPanel'
import type { StudentProfile } from '@/types/people'

interface StudentOverviewTabProps {
  profile: StudentProfile
}

/** Overview: the headline numbers, then the record itself, then the guardian. */
export function StudentOverviewTab({ profile }: StudentOverviewTabProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Attendance rate" value={`${profile.attendancePercentage}%`} tone="text-success" />
        <Stat label="Days present" value={String(profile.daysPresent)} />
        <Stat label="Streak days" value={String(profile.streakDays)} tone="text-primary" />
        <Stat
          label="Days absent"
          value={String(profile.daysAbsent)}
          tone={profile.daysAbsent > 0 ? 'text-error' : 'text-ink'}
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

function Stat({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <article className="border-line bg-surface rounded-xl border p-5 shadow-[var(--shadow-card)]">
      <p className="text-ink-muted text-[13px]">{label}</p>
      <p className={`font-display mt-2 text-[26px] leading-none font-semibold tracking-[-0.03em] ${tone}`}>{value}</p>
    </article>
  )
}

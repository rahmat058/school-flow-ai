import type { ReactNode } from 'react'
import { BRAND } from '@/lib/brand'
import { env } from '@/lib/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { activeSchool } from '@/data/school'
import { classes } from '@/data/classes'
import { DEMO_PASSWORD } from '@/data/seed'
import { users } from '@/data/users'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * Frame for the public auth screens: a brand panel on the left from `lg`, a single narrow form
 * column on the right. The panel stays on surface/canvas tones — Design.md reserves indigo for
 * interactive elements, so none of it is a decorative indigo fill.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  // A public screen names itself — there is no nav to resolve it from.
  useDocumentTitle(title)

  return (
    <div className="bg-canvas flex min-h-screen">
      <BrandPanel />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="page-container">
          <div className="mx-auto w-full max-w-md">
            {/* The panel is desktop-only, so small screens keep the wordmark above the form. */}
            <img src={BRAND.wordmark} alt={BRAND.name} className="mb-7 h-14 w-45 object-cover lg:hidden" />

            <h1 className="font-display text-ink text-[26px] font-semibold tracking-[-0.03em]">{title}</h1>
            <p className="text-ink-muted mt-1.5 text-[14px]">{subtitle}</p>

            <div className="mt-6">{children}</div>

            {footer ? <div className="text-ink-muted mt-5 text-center text-[13px]">{footer}</div> : null}

            {env.enableMocks ? (
              <p className="border-line bg-surface text-ink-subtle mt-6 rounded-lg border px-3.5 py-3 text-[11.5px]">
                <span className="text-ink font-medium">Demo mode</span> — the API is mocked. Sample password{' '}
                <span className="font-mono">{DEMO_PASSWORD}</span>, signup OTP <span className="font-mono">123456</span>
                .
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}

/** The marketing half of the split layout — hidden below `lg`, where the form takes the full width. */
function BrandPanel() {
  const studentCount = users.filter((user) => user.role === 'STUDENT').length
  const teacherCount = users.filter((user) => user.role === 'TEACHER').length

  return (
    <aside className="border-line bg-surface hidden flex-col justify-between border-r p-10 lg:flex lg:w-96 xl:w-105">
      <div>
        <img src={BRAND.wordmark} alt={BRAND.name} className="h-14 w-45 object-cover" />
        <p className="text-ink-subtle mt-3 text-[12px]">
          {activeSchool.name} · {activeSchool.settings.academicYear}
        </p>

        <h2 className="font-display text-ink mt-12 text-[27px] leading-[1.15] font-semibold tracking-[-0.03em]">
          Manage your school with confidence
        </h2>
        <p className="text-ink-muted mt-3 text-[14px] leading-relaxed">
          A complete platform for administrators, teachers, students and parents — attendance, fees, homework, exams and
          reports in one place.
        </p>

        <dl className="mt-9 grid grid-cols-3 gap-3">
          <StatTile label="Students" value={studentCount} />
          <StatTile label="Teachers" value={teacherCount} />
          <StatTile label="Classes" value={classes.length} />
        </dl>
      </div>

      <p className="text-ink-subtle text-[11px]">
        © {new Date().getFullYear()} {BRAND.name} · Sample data
      </p>
    </aside>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-line bg-canvas rounded-lg border px-3 py-2.5">
      <dt className="text-ink-subtle text-[11px]">{label}</dt>
      <dd className="font-display text-ink mt-0.5 text-[20px] font-semibold tracking-[-0.02em]">{value}</dd>
    </div>
  )
}

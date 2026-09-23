import type { ReactNode } from 'react'
import { BRAND } from '@/lib/brand'
import { env } from '@/lib/env'
import { activeSchool } from '@/data/school'
import { demoAccounts } from '@/data/users'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Shared frame for the public auth screens: flat bordered card on the canvas, per Design.md. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="bg-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6">
            <img src={BRAND.wordmark} alt={BRAND.name} className="h-10 w-auto max-w-[220px] object-contain" />
            <p className="text-ink-subtle mt-3 text-[12px]">
              {activeSchool.name} · {activeSchool.settings.academicYear}
            </p>
          </div>

          <div className="border-line bg-surface rounded-xl border p-6">
            <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">{title}</h1>
            <p className="text-ink-muted mt-1 text-[13px]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          {footer ? <div className="text-ink-muted mt-5 text-center text-[13px]">{footer}</div> : null}
        </div>

        {env.enableMocks ? <DemoAccountsPanel /> : null}
      </div>
    </div>
  )
}

/** Demo-only affordance so the flows can be explored without a backend. */
function DemoAccountsPanel() {
  return (
    <aside className="border-line bg-surface hidden rounded-xl border p-5 lg:block lg:self-start">
      <p className="text-ink text-[13px] font-medium">Demo accounts</p>
      <p className="text-ink-muted mt-1 text-[12px]">
        The API is mocked, so any of these work. Password is <span className="font-mono">demo1234</span>.
      </p>

      <ul className="mt-4 space-y-3">
        {demoAccounts.map((account) => (
          <li key={account.userId} className="border-line border-t pt-3 first:border-t-0 first:pt-0">
            <p className="text-ink-subtle text-[11px] tracking-[0.04em] uppercase">{account.label}</p>
            <p className="text-ink mt-1 font-mono text-[12px] break-all">{account.email}</p>
          </li>
        ))}
      </ul>

      <p className="text-ink-subtle mt-4 text-[11px]">The signup OTP code is 123456.</p>
    </aside>
  )
}

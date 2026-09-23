import type { LucideIcon } from 'lucide-react'
import type { Role } from '@/types/auth'
import type { InvoiceStatus } from '@/types/fees'
import type { PaymentMethod } from '@/types/fees'
import type { AiInsight } from '@/types/ai'

export type TrendDirection = 'up' | 'down'
export type IconTone = 'primary' | 'success' | 'error' | 'warning'

export interface StatMetric {
  id: string
  label: string
  value: string
  delta: string
  direction: TrendDirection
  icon: LucideIcon
  iconTone: IconTone
}

export interface ChartPoint {
  label: string
  value: number
}

/** Nav is configuration, not server data — see `src/lib/navigation.ts`. */
export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: Role[]
}

export interface RecentPayment {
  id: string
  studentName: string
  initials: string
  amountPaise: number
  status: InvoiceStatus
  method: PaymentMethod
  paidAt: string
}

export interface DashboardSummary {
  stats: StatMetric[]
  collectionTrend: ChartPoint[]
  quarterlyTrend: ChartPoint[]
  highlightedMonth: string
  recentPayments: RecentPayment[]
  insight: AiInsight
}

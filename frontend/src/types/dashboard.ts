import type { LucideIcon } from 'lucide-react'

export type TrendDirection = 'up' | 'down'

export type TransactionStatus = 'completed' | 'pending'

export type ChartPeriod = 'monthly' | 'quarterly'

export interface StatMetric {
  id: string
  label: string
  value: string
  delta: string
  direction: TrendDirection
  icon: LucideIcon
  iconTone: 'primary' | 'success' | 'error' | 'warning'
}

export interface ChartPoint {
  label: string
  value: number
}

export interface Transaction {
  id: string
  date: string
  customer: string
  initials: string
  amount: string
  status: TransactionStatus
  plan: string
}

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

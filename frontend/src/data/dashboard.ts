import {
  BarChart3,
  FileText,
  Folder,
  LayoutDashboard,
  Settings,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react'
import type {
  ChartPoint,
  NavItem,
  StatMetric,
  Transaction,
} from '@/types/dashboard'

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Files', href: '/files', icon: Folder },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export const stats: StatMetric[] = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$482,900',
    delta: '+8.2%',
    direction: 'up',
    icon: Wallet,
    iconTone: 'primary',
  },
  {
    id: 'subscriptions',
    label: 'Active Subscriptions',
    value: '12,402',
    delta: '+12%',
    direction: 'up',
    icon: Users,
    iconTone: 'success',
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    value: '1.42%',
    delta: '-2.1%',
    direction: 'down',
    icon: TrendingDown,
    iconTone: 'error',
  },
  {
    id: 'mrr',
    label: 'Average MRR',
    value: '$38.50',
    delta: '+4.5%',
    direction: 'up',
    icon: BarChart3,
    iconTone: 'warning',
  },
]

export const monthlyTrends: ChartPoint[] = [
  { label: 'JAN', value: 31200 },
  { label: 'FEB', value: 28400 },
  { label: 'MAR', value: 36800 },
  { label: 'APR', value: 40100 },
  { label: 'MAY', value: 34600 },
  { label: 'JUN', value: 45200 },
  { label: 'JUL', value: 61800 },
  { label: 'AUG', value: 42900 },
  { label: 'SEP', value: 48700 },
  { label: 'OCT', value: 53400 },
  { label: 'NOV', value: 47600 },
  { label: 'DEC', value: 51200 },
]

export const quarterlyTrends: ChartPoint[] = [
  { label: 'Q1', value: 96400 },
  { label: 'Q2', value: 119900 },
  { label: 'Q3', value: 153400 },
  { label: 'Q4', value: 152200 },
]

export const highlightedMonth = 'JUL'

export const transactions: Transaction[] = [
  {
    id: 'txn-1',
    date: 'Oct 24, 2023',
    customer: 'Stellar Corp',
    initials: 'SC',
    amount: '$1,200.00',
    status: 'completed',
    plan: 'Enterprise',
  },
  {
    id: 'txn-2',
    date: 'Oct 23, 2023',
    customer: 'Nova Media',
    initials: 'NM',
    amount: '$850.00',
    status: 'completed',
    plan: 'Business',
  },
  {
    id: 'txn-3',
    date: 'Oct 22, 2023',
    customer: 'Apex Labs',
    initials: 'AL',
    amount: '$2,400.00',
    status: 'pending',
    plan: 'Enterprise',
  },
  {
    id: 'txn-4',
    date: 'Oct 21, 2023',
    customer: 'Kinetic Labs',
    initials: 'KL',
    amount: '$340.00',
    status: 'completed',
    plan: 'Pro',
  },
  {
    id: 'txn-5',
    date: 'Oct 20, 2023',
    customer: 'Vertex Inc',
    initials: 'VI',
    amount: '$1,890.00',
    status: 'completed',
    plan: 'Business',
  },
]

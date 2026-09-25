import {
  BookMarked,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import type { Role } from '@/types/auth'
import type { NavItem } from '@/types/dashboard'

const EVERYONE: Role[] = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

/**
 * Navigation is configuration, not server state — so it lives here rather than in `src/data/`.
 * `roles` drives the sidebar filter; every item now has a real page behind it.
 */
export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: EVERYONE },
  { label: 'Students', href: '/students', icon: Users, roles: ['ADMIN', 'TEACHER'] },
  { label: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['ADMIN'] },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
  { label: 'Fees', href: '/fees', icon: Wallet, roles: ['ADMIN', 'PARENT'] },
  { label: 'Homework', href: '/homework', icon: ClipboardList, roles: EVERYONE },
  { label: 'Tests & exams', href: '/exams', icon: GraduationCap, roles: EVERYONE },
  { label: 'My Reports', href: '/my-reports', icon: FileSpreadsheet, roles: ['STUDENT'] },
  { label: 'Progress', href: '/progress', icon: TrendingUp, roles: ['STUDENT'] },
  { label: 'Timetable', href: '/timetable', icon: CalendarDays, roles: EVERYONE },
  { label: 'Study Materials', href: '/study-materials', icon: BookOpen, roles: EVERYONE },
  { label: 'Notices', href: '/notices', icon: Megaphone, roles: EVERYONE },
  { label: 'Communication', href: '/chat', icon: MessagesSquare, roles: EVERYONE },
  { label: 'AI Assistant', href: '/ai', icon: Sparkles, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { label: 'Reports', href: '/reports', icon: FileSpreadsheet, roles: ['ADMIN', 'TEACHER'] },
  { label: 'Roles & permissions', href: '/permissions', icon: ShieldCheck, roles: ['ADMIN'] },
  { label: 'Subject & Class', href: '/subjects', icon: BookMarked, roles: ['ADMIN'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN'] },
]

export function navItemsForRole(role: Role | null | undefined): NavItem[] {
  if (!role) return []
  return navItems.filter((item) => item.roles.includes(role))
}

/** Longest-prefix match so `/students/std_1` still highlights "Students"; `/` matches exactly. */
export function findNavItem(pathname: string): NavItem | undefined {
  const matches = navItems.filter((item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return matches.sort((left, right) => right.href.length - left.href.length)[0]
}

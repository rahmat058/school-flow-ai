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
/** Everyone who works with the school's records; a guardian reads a narrower sidebar. */
const STAFF_AND_STUDENTS: Role[] = ['ADMIN', 'TEACHER', 'STUDENT']

/**
 * Navigation is configuration, not server state — so it lives here rather than in `src/data/`.
 * `roles` drives the sidebar filter; every item now has a real page behind it.
 *
 * A **guardian** gets five items — Dashboard, Attendance, Results, Fees and Notices — which is the
 * sidebar their own app is designed around. The modules a guardian does not see here (Homework,
 * Timetable, Study materials, Communication) are still role-scoped in the API and reachable by URL;
 * the sidebar is what is curated, not the capability. Note that `/exams` carries **two** items: the
 * staff/student "Tests & exams" screen and the guardian's "Results" screen, which is a different view
 * of a child's published marks.
 */
export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: EVERYONE },
  { label: 'Students', href: '/students', icon: Users, roles: ['ADMIN', 'TEACHER'] },
  { label: 'Teachers', href: '/teachers', icon: GraduationCap, roles: ['ADMIN'] },
  { label: 'Attendance', href: '/attendance', icon: CalendarCheck, roles: EVERYONE },
  { label: 'Results', href: '/exams', icon: GraduationCap, roles: ['PARENT'] },
  { label: 'Fees', href: '/fees', icon: Wallet, roles: ['ADMIN', 'PARENT'] },
  { label: 'Homework', href: '/homework', icon: ClipboardList, roles: STAFF_AND_STUDENTS },
  { label: 'Tests & exams', href: '/exams', icon: GraduationCap, roles: STAFF_AND_STUDENTS },
  { label: 'My Reports', href: '/my-reports', icon: FileSpreadsheet, roles: ['STUDENT'] },
  { label: 'Progress', href: '/progress', icon: TrendingUp, roles: ['STUDENT'] },
  { label: 'Timetable', href: '/timetable', icon: CalendarDays, roles: STAFF_AND_STUDENTS },
  { label: 'Study Materials', href: '/study-materials', icon: BookOpen, roles: STAFF_AND_STUDENTS },
  { label: 'Notices', href: '/notices', icon: Megaphone, roles: EVERYONE },
  { label: 'Communication', href: '/chat', icon: MessagesSquare, roles: STAFF_AND_STUDENTS },
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

/**
 * Longest-prefix match so `/students/std_1` still highlights "Students"; `/` matches exactly.
 * Passing a role resolves the item that role actually has — `/exams` is "Results" to a guardian and
 * "Tests & exams" to everyone else, and the header title follows the sidebar, not the first entry.
 */
export function findNavItem(pathname: string, role?: Role | null): NavItem | undefined {
  const candidates = role ? navItemsForRole(role) : navItems
  const matches = candidates.filter((item) =>
    item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return matches.sort((left, right) => right.href.length - left.href.length)[0]
}

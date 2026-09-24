import type { RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute'
import { RoleGuard } from '@/routes/guards/RoleGuard'
import {
  DashboardPage,
  FeeCollectPage,
  FeesPage,
  NotFoundPage,
  NoticesPage,
  StudentProfilePage,
  StudentsPage,
  TeachersPage,
} from '@/routes/lazyPages'
import { childPath, paths } from '@/routes/paths'

/**
 * Modules that are planned but not built yet. Keeping them routed means the role-aware sidebar never
 * links to a dead end — each renders `PlaceholderPage` inside the shell.
 */
const upcomingModules: Array<{ path: string; title: string; description: string }> = [
  {
    path: paths.attendance,
    title: 'Attendance',
    description: 'Daily register, bulk marking, monthly view and attendance analytics arrive in Phase 3.',
  },
  {
    path: paths.homework,
    title: 'Homework',
    description: 'Assignment creation, student submissions and grading arrive in Phase 3.',
  },
  {
    path: paths.exams,
    title: 'Exams & results',
    description: 'Exam scheduling, marks entry, publishing and report cards arrive in Phase 4.',
  },
  {
    path: paths.timetable,
    title: 'Timetable',
    description: 'The weekly class timetable and teacher view arrive with Phase 2.',
  },
  {
    path: paths.materials,
    title: 'Study material',
    description: 'Uploads and downloads for notes, worksheets and previous-year papers arrive in Phase 3.',
  },
  {
    path: paths.chat,
    title: 'Messages',
    description: 'Real-time chat between permitted role pairs arrives in Phase 5.',
  },
  {
    path: paths.reports,
    title: 'Reports',
    description: 'Attendance, financial and student reports with CSV export arrive in Phase 4.',
  },
  {
    path: paths.settings,
    title: 'School settings',
    description: 'Academic year, grading scheme, fee heads and branding arrive in Phase 2.',
  },
]

const upcomingRoutes: RouteObject[] = upcomingModules.map((module) => ({
  path: childPath(module.path),
  element: <PlaceholderPage title={module.title} description={module.description} />,
}))

/** Authenticated routes: the shell wraps every page, with role checks around restricted groups. */
export const privateRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            element: <RoleGuard allow={['ADMIN', 'TEACHER']} />,
            children: [{ path: childPath(paths.students), element: <StudentsPage /> }],
          },
          {
            element: <RoleGuard allow={['ADMIN']} />,
            children: [{ path: childPath(paths.teachers), element: <TeachersPage /> }],
          },
          {
            // Guardians may open their own child's profile, so parents are allowed here.
            element: <RoleGuard allow={['ADMIN', 'TEACHER', 'PARENT']} />,
            children: [{ path: childPath(paths.studentDetail), element: <StudentProfilePage /> }],
          },
          {
            element: <RoleGuard allow={['ADMIN', 'PARENT']} />,
            children: [
              { path: childPath(paths.fees), element: <FeesPage /> },
              { path: childPath(paths.feeCollect), element: <FeeCollectPage /> },
            ],
          },
          { path: childPath(paths.notices), element: <NoticesPage /> },
          ...upcomingRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

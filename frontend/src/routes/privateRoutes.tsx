import type { RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute'
import { RoleGuard } from '@/routes/guards/RoleGuard'
import {
  AiAssistantPage,
  ChatPage,
  DashboardPage,
  ExamsPage,
  FeeCollectPage,
  FeesPage,
  HomeworkPage,
  MaterialsPage,
  NotFoundPage,
  NoticesPage,
  PermissionsPage,
  ReportsPage,
  StudentProfilePage,
  StudentsPage,
  TeachersPage,
  TimetablePage,
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
            children: [
              { path: childPath(paths.students), element: <StudentsPage /> },
              { path: childPath(paths.reports), element: <ReportsPage /> },
            ],
          },
          {
            element: <RoleGuard allow={['ADMIN']} />,
            children: [
              { path: childPath(paths.teachers), element: <TeachersPage /> },
              { path: childPath(paths.permissions), element: <PermissionsPage /> },
            ],
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
          // Readable by every role; the page itself withholds the write controls from students and parents.
          { path: childPath(paths.homework), element: <HomeworkPage /> },
          // Readable by every role; the page withholds the upload controls from students and parents.
          { path: childPath(paths.materials), element: <MaterialsPage /> },
          // Readable by every role; the grid's write controls are admin-only, per the API contract.
          { path: childPath(paths.timetable), element: <TimetablePage /> },
          { path: childPath(paths.notices), element: <NoticesPage /> },
          { path: childPath(paths.chat), element: <ChatPage /> },
          { path: childPath(paths.exams), element: <ExamsPage /> },
          { path: childPath(paths.ai), element: <AiAssistantPage /> },
          ...upcomingRoutes,
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

import type { RouteObject } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute'
import { RoleGuard } from '@/routes/guards/RoleGuard'
import {
  AiAssistantPage,
  AttendancePage,
  ChatPage,
  DashboardPage,
  ExamsPage,
  FeeCollectPage,
  FeesPage,
  HomeworkPage,
  MaterialsPage,
  MyReportsPage,
  NotFoundPage,
  NoticesPage,
  PermissionsPage,
  ProgressPage,
  ReportsPage,
  SettingsPage,
  StudentProfilePage,
  SubjectClassPage,
  StudentsPage,
  TeachersPage,
  TimetablePage,
} from '@/routes/lazyPages'
import { childPath, paths } from '@/routes/paths'

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
            // A student's own results, fees and progress; the staff `/reports` and `/fees` are separate.
            element: <RoleGuard allow={['STUDENT']} />,
            children: [
              { path: childPath(paths.myReports), element: <MyReportsPage /> },
              { path: childPath(paths.progress), element: <ProgressPage /> },
            ],
          },
          {
            element: <RoleGuard allow={['ADMIN']} />,
            children: [
              { path: childPath(paths.teachers), element: <TeachersPage /> },
              { path: childPath(paths.permissions), element: <PermissionsPage /> },
              { path: childPath(paths.subjects), element: <SubjectClassPage /> },
              { path: childPath(paths.settings), element: <SettingsPage /> },
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
          // Every role has a register; the page withholds the class view from students and parents.
          { path: childPath(paths.attendance), element: <AttendancePage /> },
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
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]

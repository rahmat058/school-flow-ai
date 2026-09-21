import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="analytics"
            element={
              <PlaceholderPage
                title="Analytics"
                description="Deeper cohort, funnel, and retention views will live here."
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Reports"
                description="Scheduled exports and saved executive reports will appear on this page."
              />
            }
          />
          <Route
            path="files"
            element={
              <PlaceholderPage
                title="Files"
                description="Uploaded datasets and generated report files will be organized here."
              />
            }
          />
          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Settings"
                description="Workspace, billing, and notification preferences will be managed here."
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

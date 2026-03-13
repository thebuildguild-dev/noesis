import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/auth.store.js'
import LandingPage from './pages/landing/LandingPage.jsx'
import LoginPage from './pages/login/LoginPage.jsx'
import RegisterPage from './pages/register/RegisterPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import HabitsPage from './pages/habits/HabitsPage.jsx'
import HabitDetailPage from './pages/habits/HabitDetailPage.jsx'
import JournalPage from './pages/journal/JournalPage.jsx'
import JournalEditorPage from './pages/journal/JournalEditorPage.jsx'
import JournalViewPage from './pages/journal/JournalViewPage.jsx'
import ProfilePage from './pages/profile/ProfilePage.jsx'
import CalendarPage from './pages/calendar/CalendarPage.jsx'
import ResetPasswordPage from './pages/reset-password/ResetPasswordPage.jsx'
import ForgotPasswordPage from './pages/forgot-password/ForgotPasswordPage.jsx'
import InsightsPage from './pages/insights/InsightsPage.jsx'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/habits"
        element={
          <ProtectedRoute>
            <HabitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/habits/:id"
        element={
          <ProtectedRoute>
            <HabitDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/editor"
        element={
          <ProtectedRoute>
            <JournalEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/:id"
        element={
          <ProtectedRoute>
            <JournalViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            <InsightsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

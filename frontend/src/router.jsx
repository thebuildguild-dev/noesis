import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/auth.store.js'
import LandingPage from './pages/landing/LandingPage.jsx'
import LoginPage from './pages/login/LoginPage.jsx'
import RegisterPage from './pages/register/RegisterPage.jsx'
import DashboardPage from './pages/dashboard/DashboardPage.jsx'
import HabitsPage from './pages/habits/HabitsPage.jsx'
import JournalPage from './pages/journal/JournalPage.jsx'
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
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalPage />
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
        path="/calendar"
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

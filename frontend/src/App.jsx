// App.jsx — Router + auth gate + page transitions

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage   from './pages/LandingPage'
import AnalyzePage   from './pages/AnalyzePage'
import ImproverPage        from './pages/ImproverPage'
import HistoryPage          from './pages/HistoryPage'
import AnalysisDetailPage   from './pages/AnalysisDetailPage'
import ForgotPasswordPage   from './pages/ForgotPasswordPage'
import ResetPasswordPage    from './pages/ResetPasswordPage'
import VerifyEmailPage      from './pages/VerifyEmailPage'
import NotFoundPage         from './pages/NotFoundPage'
import AccountPage          from './pages/AccountPage'
import TermsPage            from './pages/TermsPage'
import PrivacyPage          from './pages/PrivacyPage'

// ProtectedRoute: must be logged in, else go to /login
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--navy-950)',
        color: 'var(--text-secondary)', fontSize: '0.875rem', gap: '10px',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'spin 0.7s linear infinite' }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

// PublicRoute: already logged in → go to /dashboard
// Show children while auth check is in progress so the page never appears blank.
// Redirect to dashboard only once we know for certain the user is logged in.
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to="/dashboard" replace />
  return children
}

// AnimatedRoutes: keyed by pathname so AnimatePresence detects changes
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public landing — open to everyone */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages — redirect to dashboard if already logged in */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Analyser — open to everyone (guest mode shown if not authed) */}
        <Route path="/analyze" element={<AnalyzePage />} />

        {/* Resume Improver — open to everyone (guest mode shown if not authed) */}
        <Route path="/improve" element={<ImproverPage />} />

        {/* Legal — public */}
        <Route path="/terms"   element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Password reset + email verification — public */}
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />

        {/* Hub — protected */}
        <Route path="/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/history"        element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/analyses/:id"   element={<ProtectedRoute><AnalysisDetailPage /></ProtectedRoute>} />
        <Route path="/account"        element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

        {/* Catch-all → 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--navy-800)',
              color: 'var(--text-primary)',
              border: '1px solid var(--navy-700)',
              borderRadius: '10px',
              fontSize: '0.875rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--navy-800)' } },
            error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'var(--navy-800)' } },
          }}
        />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

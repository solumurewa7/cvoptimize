// App.jsx — Router + auth gate
//
// HOW ROUTING WORKS:
//   BrowserRouter watches the URL and renders the matching <Route>.
//   ProtectedRoute checks if the user is logged in before showing a page.
//   If not logged in → redirect to /login.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'

// ProtectedRoute: renders children only if logged in, else redirects to /login.
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--navy-950)',
        color: 'var(--text-secondary)',
      }}>
        Loading…
      </div>
    )
  }

  // user === false means "checked and not logged in"
  if (!user) return <Navigate to="/login" replace />
  return children
}

// PublicRoute: if already logged in, skip login/register and go to dashboard.
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* react-hot-toast notification container */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--navy-800)',
              color: 'var(--text-primary)',
              border: '1px solid var(--navy-700)',
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute><RegisterPage /></PublicRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* Catch-all — unknown URLs go to dashboard (which may redirect to login) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

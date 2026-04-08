// pages/LoginPage.jsx — polished auth card with entrance animation

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import SEO from '../components/SEO'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [focused,  setFocused]  = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--navy-950)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <SEO title="Sign In" noIndex />
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
        }}
      >
        {/* Card */}
        <div style={{
          background: 'var(--navy-900)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          padding: '44px 40px 40px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '9px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(59,130,246,0.35)',
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="6" rx="1.2" fill="white" opacity="0.9"/>
                  <rect x="9" y="2" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
                  <rect x="9" y="7" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
                  <rect x="2" y="10" width="12" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
                  <rect x="2" y="13" width="8" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                CV<span style={{ color: 'var(--accent)' }}>Optimize</span>
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Welcome back — sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <FieldGroup label="Email" focused={focused === 'email'}>
              <input
                className="cv-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </FieldGroup>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="cv-label" style={{ color: focused === 'password' ? 'var(--accent)' : undefined, transition: 'color 0.15s', margin: 0 }}>
                  Password
                </label>
                <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.78rem', textDecoration: 'none', opacity: 0.85 }}>
                  Forgot password?
                </Link>
              </div>
              <input
                className="cv-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cv-btn"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? (
                <>
                  <Spinner /> Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '28px 0',
          }}>
            <hr className="cv-divider" style={{ flex: 1 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              New here?
            </span>
            <hr className="cv-divider" style={{ flex: 1 }} />
          </div>

          <Link
            to="/register"
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'var(--navy-800)',
              border: '1px solid var(--navy-700)',
              borderRadius: '10px',
              padding: '11px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--navy-700)'
              e.currentTarget.style.borderColor = 'var(--navy-600)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--navy-800)'
              e.currentTarget.style.borderColor = 'var(--navy-700)'
            }}
          >
            Create an account
          </Link>
        </div>

        <Link
          to="/analyze"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '20px',
            color: 'var(--text-secondary)',
            fontSize: '0.825rem',
            textDecoration: 'none',
            opacity: 0.7,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
        >
          Continue as guest →
        </Link>
      </motion.div>
    </div>
  )
}

function FieldGroup({ label, focused, children }) {
  return (
    <div>
      <label className="cv-label" style={{ color: focused ? 'var(--accent)' : undefined, transition: 'color 0.15s' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}

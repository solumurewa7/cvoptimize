// pages/ForgotPasswordPage.jsx — request a password reset link

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import client from '../api/client'
import SEO from '../components/SEO'

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focused,   setFocused]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await client.post('/api/auth/forgot-password', { email })
    } catch (_) {
      // Ignore errors — always show success to prevent email enumeration
    } finally {
      setLoading(false)
      setSubmitted(true)
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
      <SEO title="Reset Password" noIndex />
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
        style={{ width: '100%', maxWidth: '420px', position: 'relative' }}
      >
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
                width: 34, height: 34, borderRadius: '9px',
                background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          </div>

          {submitted ? (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: 'center', padding: '8px 0 16px' }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                border: '2px solid var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Check your inbox
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 28px' }}>
                If that email is registered, a reset link is on its way. Check your spam folder if you don't see it.
              </p>
              <Link to="/login" style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none' }}>
                ← Back to sign in
              </Link>
            </motion.div>
          ) : (
            /* Form state */
            <>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Forgot your password?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 28px', lineHeight: 1.6 }}>
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label className="cv-label" style={{ color: focused ? 'var(--accent)' : undefined, transition: 'color 0.15s' }}>
                    Email
                  </label>
                  <input
                    className="cv-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
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
                      <Spinner /> Sending…
                    </>
                  ) : 'Send reset link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', textDecoration: 'none' }}>
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}

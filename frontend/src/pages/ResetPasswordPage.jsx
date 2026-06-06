// pages/ResetPasswordPage.jsx — set a new password via reset token

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import client from '../api/client'
import SEO from '../components/SEO'
import PasswordInput from '../components/PasswordInput'

export default function ResetPasswordPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const token          = params.get('token') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [focused,   setFocused]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await client.post('/api/auth/reset-password', { token, password })
      toast.success('Password updated — sign in with your new password')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong.'
      setError(msg)
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

          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Set a new password
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 28px', lineHeight: 1.6 }}>
            Choose a strong password of at least 8 characters.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="cv-label" style={{ color: focused === 'pw' ? 'var(--accent)' : undefined, transition: 'color 0.15s' }}>
                New password
              </label>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('pw')}
                onBlur={() => setFocused(null)}
                required
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="cv-label" style={{ color: focused === 'cf' ? 'var(--accent)' : undefined, transition: 'color 0.15s' }}>
                Confirm password
              </label>
              <PasswordInput
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocused('cf')}
                onBlur={() => setFocused(null)}
                required
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.83rem',
                color: 'var(--danger)',
                lineHeight: 1.5,
              }}>
                {error}
                {(error.includes('invalid') || error.includes('expired')) && (
                  <span> <Link to="/forgot-password" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Request a new link →</Link></span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cv-btn"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? (
                <>
                  <Spinner /> Updating…
                </>
              ) : 'Update password'}
            </button>
          </form>
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

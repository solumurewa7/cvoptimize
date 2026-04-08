// pages/VerifyEmailPage.jsx — consume a ?token= link to verify email address

import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import client from '../api/client'
import SEO from '../components/SEO'

const EASE = [0.22, 1, 0.36, 1]

export default function VerifyEmailPage() {
  const [params]  = useSearchParams()
  const token     = params.get('token') || ''

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (!token) {
      setError('No verification token found in the link.')
      setStatus('error')
      return
    }

    client.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('success'))
      .catch(err => {
        setError(err.response?.data?.error || 'Verification failed — the link may have expired.')
        setStatus('error')
      })
  }, [token])

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
      <SEO title="Verify Email" noIndex />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative' }}
      >
        <div style={{
          background: 'var(--navy-900)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          padding: '44px 40px 40px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
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

          {status === 'loading' && (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 20px', display: 'block' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Verifying your email…
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)',
                border: '2px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Email verified!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 28px' }}>
                Your account is fully set up. You're good to go.
              </p>
              <Link to="/dashboard" className="cv-btn" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                Go to Dashboard →
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                Link invalid or expired
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 28px' }}>
                {error}
              </p>
              <Link to="/dashboard" style={{ color: 'var(--accent)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: 600 }}>
                Go to Dashboard to resend →
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

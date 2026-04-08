// pages/AccountPage.jsx — profile, password, and danger zone

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'

const EASE = [0.22, 1, 0.36, 1]

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  // ── Personal info state ────────────────────────────────────────────────────
  const [name,        setName]        = useState(user?.full_name || '')
  const [email,       setEmail]       = useState(user?.email || '')
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [infoError,   setInfoError]   = useState('')

  // ── Password state ─────────────────────────────────────────────────────────
  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [savingPw,    setSavingPw]    = useState(false)
  const [pwError,     setPwError]     = useState('')

  // ── Delete state ───────────────────────────────────────────────────────────
  const [showDelete,  setShowDelete]  = useState(false)
  const [deletePw,    setDeletePw]    = useState('')
  const [deleting,    setDeleting]    = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // ── Focus tracking ─────────────────────────────────────────────────────────
  const [focused, setFocused] = useState(null)

  async function handleSaveInfo(e) {
    e.preventDefault()
    setInfoError('')
    setSavingInfo(true)
    try {
      const res = await client.put('/api/auth/profile', { full_name: name, email })
      updateUser(res.data.user)
      toast.success('Profile updated')
    } catch (err) {
      setInfoError(err.response?.data?.error || 'Could not update profile')
    } finally {
      setSavingInfo(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return }
    if (newPw.length < 8)    { setPwError('Password must be at least 8 characters'); return }
    setSavingPw(true)
    try {
      await client.put('/api/auth/password', { current_password: currentPw, new_password: newPw })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast.success('Password updated')
    } catch (err) {
      setPwError(err.response?.data?.error || 'Could not update password')
    } finally {
      setSavingPw(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('')
    setDeleting(true)
    try {
      await client.delete('/api/auth/account', { data: { password: deletePw } })
      await logout()
      toast.success('Account deleted')
      navigate('/')
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Could not delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Account Settings" noIndex />
      <Navbar />
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px 100px' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>

          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-block', marginBottom: '28px' }}>
            ← Dashboard
          </Link>

          {/* Page header with Gravatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
            <img
              src={user?.gravatar_url}
              alt="Avatar"
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex' }}
              style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--navy-700)', flexShrink: 0 }}
            />
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, color: '#fff',
              border: '2px solid var(--navy-700)',
            }}>
              {(user?.full_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                Account settings
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                {user?.email}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Personal info ── */}
            <SectionCard title="Personal Information">
              <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label="Display name" focused={focused === 'name'}>
                  <input
                    className="cv-input"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Email address" focused={focused === 'email'}>
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
                </Field>
                {infoError && <ErrorBox>{infoError}</ErrorBox>}
                <button type="submit" disabled={savingInfo} className="cv-btn" style={{ alignSelf: 'flex-start' }}>
                  {savingInfo ? <><Spinner /> Saving…</> : 'Save changes'}
                </button>
              </form>
            </SectionCard>

            {/* ── Change password ── */}
            <SectionCard title="Change Password">
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label="Current password" focused={focused === 'cur'}>
                  <input
                    className="cv-input"
                    type="password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    onFocus={() => setFocused('cur')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="New password" focused={focused === 'new'}>
                  <input
                    className="cv-input"
                    type="password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    onFocus={() => setFocused('new')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password" focused={focused === 'cfm'}>
                  <input
                    className="cv-input"
                    type="password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    onFocus={() => setFocused('cfm')}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </Field>
                {pwError && <ErrorBox>{pwError}</ErrorBox>}
                <button type="submit" disabled={savingPw} className="cv-btn" style={{ alignSelf: 'flex-start' }}>
                  {savingPw ? <><Spinner /> Updating…</> : 'Update password'}
                </button>
              </form>
            </SectionCard>

            {/* ── Danger zone ── */}
            <div style={{
              background: 'var(--navy-900)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ color: 'var(--danger)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                Danger Zone
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 20px', lineHeight: 1.6 }}>
                Permanently delete your account and all saved resumes and analyses. <strong style={{ color: 'var(--text-primary)' }}>This cannot be undone.</strong>
              </p>

              {!showDelete ? (
                <button
                  onClick={() => setShowDelete(true)}
                  style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '9px', padding: '9px 18px',
                    color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                >
                  Delete my account
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
                    Enter your password to confirm:
                  </p>
                  <input
                    className="cv-input"
                    type="password"
                    value={deletePw}
                    onChange={e => setDeletePw(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                  {deleteError && <ErrorBox>{deleteError}</ErrorBox>}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || !deletePw}
                      style={{
                        background: 'var(--danger)', border: 'none', borderRadius: '9px',
                        padding: '9px 18px', color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                        cursor: deleting || !deletePw ? 'not-allowed' : 'pointer',
                        opacity: deleting || !deletePw ? 0.6 : 1,
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {deleting ? <><Spinner /> Deleting…</> : 'Yes, delete my account'}
                    </button>
                    <button
                      onClick={() => { setShowDelete(false); setDeletePw(''); setDeleteError('') }}
                      className="cv-btn-ghost"
                      style={{ padding: '9px 18px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: 'var(--navy-900)', border: '1px solid var(--navy-700)', borderRadius: '16px', padding: '24px' }}>
      <h2 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, focused, children }) {
  return (
    <div>
      <label className="cv-label" style={{ color: focused ? 'var(--accent)' : undefined, transition: 'color 0.15s' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorBox({ children }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '8px', padding: '10px 14px',
      fontSize: '0.83rem', color: 'var(--danger)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.4"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  )
}

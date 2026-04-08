// components/Navbar.jsx — sticky nav with Tools hover dropdown + mobile hamburger drawer

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '../hooks/useIsMobile'

// ─── Tools dropdown items — defined after icon components below ───────────────
// (TOOLS is used in JSX, icons are hoisted as function declarations so this is fine)
const TOOLS = [
  { icon: <MatchIcon />,    label: 'Job Match',  description: 'See how well your CV fits a role',          href: '/analyze', disabled: false },
  { icon: <SparklesIcon />, label: 'Improve CV', description: 'AI suggestions to strengthen your resume',  href: '/improve', disabled: false },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()

  // Tools dropdown
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)

  // Avatar dropdown
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef(null)

  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleMouseEnter() {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  function closeDrawer() { setDrawerOpen(false) }

  function drawerNav(href) {
    closeDrawer()
    navigate(href)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 28px',
          background: 'rgba(13, 31, 60, 0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 1px 24px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(59,130,246,0.4)', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="6" rx="1.2" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
              <rect x="9" y="7" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
              <rect x="2" y="10" width="12" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
              <rect x="2" y="13" width="8" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
            CV<span style={{ color: 'var(--accent)' }}>Optimize</span>
          </span>
        </Link>

        {/* ── Desktop centre nav (authenticated only) ── */}
        {!isMobile && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NavLink to="/dashboard">Dashboard</NavLink>

            <div
              style={{ position: 'relative' }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: open ? 'var(--navy-800)' : 'transparent',
                  border: 'none', borderRadius: '8px',
                  color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
                  padding: '6px 10px', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                Tools
                <motion.svg
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </motion.svg>
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1    }}
                    exit={{ opacity: 0,  y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', left: '50%',
                      transform: 'translateX(-50%)', minWidth: '240px',
                      background: 'var(--navy-900)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                      padding: '8px', overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -5, left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: 10, height: 10,
                      background: 'var(--navy-900)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderBottom: 'none', borderRight: 'none',
                    }} />
                    {TOOLS.map((tool) => (
                      <DropdownItem
                        key={tool.label}
                        tool={tool}
                        onNavigate={(href) => { setOpen(false); navigate(href) }}
                      />
                    ))}
                    <div style={{ margin: '6px 8px 4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0, opacity: 0.6, letterSpacing: '0.02em' }}>
                        More tools coming soon
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Desktop right side ── */}
        {!isMobile && (
          user ? (
            <div ref={avatarRef} style={{ position: 'relative' }}>
              {/* Clickable avatar chip */}
              <button
                onClick={() => setAvatarOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  background: avatarOpen ? 'var(--navy-700)' : 'var(--navy-800)',
                  border: '1px solid var(--navy-700)',
                  borderRadius: '999px', padding: '4px 10px 4px 4px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                <AvatarImg user={user} size={26} />
                <span style={{
                  color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500,
                  maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.full_name || user.email}
                </span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ opacity: 0.5, transform: avatarOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Avatar dropdown */}
              <AnimatePresence>
                {avatarOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      minWidth: '220px',
                      background: 'var(--navy-900)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* User info header */}
                    <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AvatarImg user={user} size={32} />
                        <div style={{ minWidth: 0 }}>
                          {user.full_name && (
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.full_name}
                            </p>
                          )}
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px' }}>
                      <AvatarMenuItem
                        icon={<SettingsIcon />}
                        onClick={() => { setAvatarOpen(false); navigate('/account') }}
                      >
                        Account settings
                      </AvatarMenuItem>
                      <AvatarMenuItem
                        icon={<SignOutIcon />}
                        onClick={() => { setAvatarOpen(false); logout() }}
                      >
                        Sign out
                      </AvatarMenuItem>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="cv-btn-ghost" style={{ textDecoration: 'none', padding: '7px 16px' }}>Sign in</Link>
              <Link to="/register" className="cv-btn" style={{ textDecoration: 'none', padding: '7px 18px', fontSize: '0.875rem' }}>Sign up free</Link>
            </div>
          )
        )}

        {/* ── Mobile hamburger ── */}
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isMobile && drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                zIndex: 98,
                backdropFilter: 'blur(2px)',
              }}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '280px',
                background: 'var(--navy-900)',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                zIndex: 99,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  CV<span style={{ color: 'var(--accent)' }}>Optimize</span>
                </span>
                <button
                  onClick={closeDrawer}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex' }}
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <div style={{ padding: '12px 12px', flex: 1 }}>
                {user && (
                  <>
                    <DrawerLink onClick={() => drawerNav('/dashboard')}>Dashboard</DrawerLink>
                    <div style={{ margin: '4px 0 8px', padding: '6px 8px' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Tools</p>
                      <DrawerLink onClick={() => drawerNav('/analyze')}>
                        <MatchIcon /> Job Match
                      </DrawerLink>
                      <DrawerLink onClick={() => drawerNav('/improve')}>
                        <SparklesIcon /> Improve CV
                      </DrawerLink>
                    </div>
                    <DrawerLink onClick={() => drawerNav('/history')}>History</DrawerLink>
                  </>
                )}

                {!user && (
                  <>
                    <DrawerLink onClick={() => drawerNav('/analyze')}>
                      <MatchIcon /> Job Match
                    </DrawerLink>
                    <DrawerLink onClick={() => drawerNav('/improve')}>
                      <SparklesIcon /> Improve CV
                    </DrawerLink>
                  </>
                )}
              </div>

              {/* User section */}
              <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {user ? (
                  <>
                    <div style={{ padding: '10px 12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AvatarImg user={user} size={32} />
                        <div style={{ minWidth: 0 }}>
                          {user.full_name && (
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {user.full_name}
                            </p>
                          )}
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DrawerLink onClick={() => drawerNav('/account')}>
                      <SettingsIcon /> Account settings
                    </DrawerLink>
                    <button
                      onClick={() => { closeDrawer(); logout() }}
                      className="cv-btn-ghost"
                      style={{ width: '100%', justifyContent: 'center', padding: '9px', marginTop: '6px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link to="/login" className="cv-btn-ghost" onClick={closeDrawer}
                      style={{ textDecoration: 'none', textAlign: 'center', padding: '10px' }}>
                      Sign in
                    </Link>
                    <Link to="/register" className="cv-btn" onClick={closeDrawer}
                      style={{ textDecoration: 'none', textAlign: 'center', padding: '10px' }}>
                      Sign up free
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Drawer link ──────────────────────────────────────────────────────────────
function DrawerLink({ onClick, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', background: hovered ? 'var(--navy-800)' : 'transparent',
        border: 'none', borderRadius: '9px', padding: '11px 12px',
        color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Dropdown item ────────────────────────────────────────────────────────────
function DropdownItem({ tool, onNavigate }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => !tool.disabled && tool.href && onNavigate(tool.href)}
      disabled={tool.disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        width: '100%', padding: '10px 12px', borderRadius: '9px',
        border: 'none',
        background: hovered && !tool.disabled ? 'var(--navy-800)' : 'transparent',
        cursor: tool.disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', opacity: tool.disabled ? 0.5 : 1,
        transition: 'background 0.12s', fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '8px',
        background: hovered && !tool.disabled ? 'rgba(59,130,246,0.12)' : 'var(--navy-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered && !tool.disabled ? 'var(--accent)' : 'var(--text-secondary)',
        flexShrink: 0, transition: 'background 0.12s, color 0.12s',
      }}>
        {tool.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: tool.disabled ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
            {tool.label}
          </span>
          {tool.badge && (
            <span style={{
              background: 'rgba(245,158,11,0.15)', color: 'var(--warning)',
              border: '1px solid rgba(245,158,11,0.25)', borderRadius: '999px',
              padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
            }}>
              {tool.badge}
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0, marginTop: '1px' }}>
          {tool.description}
        </p>
      </div>
      {!tool.disabled && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={hovered ? 'var(--accent)' : 'var(--navy-600)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'stroke 0.12s' }}>
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      )}
    </button>
  )
}

// ─── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({ to, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none',
        padding: '6px 10px', borderRadius: '8px',
        background: hovered ? 'var(--navy-800)' : 'transparent',
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {children}
    </Link>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function MatchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

// ─── Avatar image with initials fallback ──────────────────────────────────────
function AvatarImg({ user, size }) {
  const [imgError, setImgError] = useState(false)
  const initial = (user?.full_name || user?.email || '?')[0].toUpperCase()

  if (!imgError && user?.gravatar_url) {
    return (
      <img
        src={user.gravatar_url}
        alt={initial}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          objectFit: 'cover',
        }}
      />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${size * 0.38}px`, fontWeight: 700, color: '#fff',
    }}>
      {initial}
    </div>
  )
}

// ─── Avatar dropdown menu item ────────────────────────────────────────────────
function AvatarMenuItem({ icon, onClick, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '9px 12px', borderRadius: '9px',
        background: hovered ? 'var(--navy-800)' : 'transparent',
        border: 'none', color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit',
        cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s, color 0.12s',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

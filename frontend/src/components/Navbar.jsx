// components/Navbar.jsx — top navigation bar

import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav style={{
      background: 'var(--navy-900)',
      borderBottom: '1px solid var(--navy-700)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <span style={{
        color: 'var(--accent)',
        fontWeight: 700,
        fontSize: '1.2rem',
        letterSpacing: '-0.02em',
      }}>
        CVOptimize
      </span>

      {/* Right side */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {user.email}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid var(--navy-700)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}

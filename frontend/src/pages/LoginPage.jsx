// pages/LoginPage.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
    }}>
      <div style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--navy-700)',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
      }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.5rem', margin: '0 0 4px' }}>
          CVOptimize
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px', fontSize: '0.9rem' }}>
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} style={btnStyle(loading)}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '24px', textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--navy-800)',
  border: '1px solid var(--navy-700)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  padding: '10px 14px',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnStyle = (disabled) => ({
  background: disabled ? 'var(--navy-700)' : 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '11px',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: '4px',
})

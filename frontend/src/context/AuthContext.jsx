// context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

// ---------------------------------------------------------------------------
// Cache helpers — store non-sensitive user profile in localStorage so the UI
// can restore instantly on refresh while the server validates in the background.
// The JWT itself stays in the httpOnly cookie — we never cache that.
// ---------------------------------------------------------------------------
const CACHE_KEY = 'cv_user'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(user) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(user)) } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  // Initialise from cache → instant restore, no loading flash
  const cached = readCache()
  const [user,    setUser]    = useState(cached)
  // Skip the loading spinner if we already have a cached user
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    // Always re-validate with the server in the background.
    // On success: refresh the cache with the latest profile data.
    // On failure (401 / network): clear cache and mark as logged out.
    client.get('/api/auth/me')
      .then(res => {
        setUser(res.data.user)
        writeCache(res.data.user)
      })
      .catch(() => {
        setUser(false)
        clearCache()
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await client.post('/api/auth/login', { email, password })
    setUser(res.data.user)
    writeCache(res.data.user)
    return res.data.user
  }

  async function register(email, password, fullName) {
    const res = await client.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    setUser(res.data.user)
    writeCache(res.data.user)
    return res.data.user
  }

  async function logout() {
    await client.post('/api/auth/logout')
    setUser(false)
    clearCache()
  }

  function updateUser(data) {
    setUser(data)
    writeCache(data)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

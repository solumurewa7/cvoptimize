// context/AuthContext.jsx
//
// React Context that holds the logged-in user's data and auth actions.
//
// HOW CONTEXT WORKS (for reference):
// - createContext() creates a "bucket" that any component can read from
// - AuthProvider wraps the whole app and fills that bucket
// - useAuth() is a hook any component calls to read/use what's in the bucket
//
// WHY context for auth?
// Without it, you'd have to pass user/setUser as props through every component.
// Context makes it available anywhere without "prop drilling".

import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // null = not checked yet, false = checked and not logged in, object = user data
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)  // true while we check /api/auth/me

  // On first load, ask the server if we're already logged in.
  // The JWT cookie is sent automatically (withCredentials: true).
  useEffect(() => {
    client.get('/api/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(false))   // 401 = not logged in
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await client.post('/api/auth/login', { email, password })
    setUser(res.data.user)
    return res.data.user
  }

  async function register(email, password, fullName) {
    const res = await client.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
    })
    setUser(res.data.user)
    return res.data.user
  }

  async function logout() {
    await client.post('/api/auth/logout')
    setUser(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — components call useAuth() instead of useContext(AuthContext)
export function useAuth() {
  return useContext(AuthContext)
}

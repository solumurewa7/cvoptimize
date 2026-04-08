// api/client.js
//
// A pre-configured axios instance used by every API call in the app.
//
// WHY a shared instance instead of raw fetch()?
// - One place to set base URL, credentials, headers
// - Interceptors: global CSRF token injection for protected routes
// - withCredentials: tells the browser to include our JWT cookie on every request

import axios from 'axios'

const client = axios.create({
  // In development: empty string → Vite proxy forwards /api/* to Flask on localhost:5000
  // In production: VITE_API_URL env var points directly to the Render backend
  baseURL: import.meta.env.VITE_API_URL || '',

  // CRITICAL: send cookies (our JWT) on every request.
  // Without this, the browser strips the cookie and every API call returns 401.
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
  },
})

// CSRF protection: Flask-JWT-Extended sets a readable `csrf_access_token` cookie.
// On state-changing requests we must echo it back as the X-CSRF-TOKEN header.
client.interceptors.request.use(config => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_access_token='))
    if (match) config.headers['X-CSRF-TOKEN'] = match.split('=')[1]
  }
  return config
})

export default client

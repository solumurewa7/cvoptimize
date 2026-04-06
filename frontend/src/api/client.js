// api/client.js
//
// A pre-configured axios instance used by every API call in the app.
//
// WHY a shared instance instead of raw fetch()?
// - One place to set base URL, credentials, headers
// - Interceptors: we can add global error handling here later
// - withCredentials: tells the browser to include our JWT cookie on every request

import axios from 'axios'

const client = axios.create({
  // Empty baseURL — Vite's proxy forwards /api/* to Flask on localhost:5000.
  // In production, this would be your deployed API URL.
  baseURL: '',

  // CRITICAL: send cookies (our JWT) on every request.
  // Without this, the browser strips the cookie and every API call returns 401.
  withCredentials: true,

  headers: {
    'Content-Type': 'application/json',
  },
})

export default client

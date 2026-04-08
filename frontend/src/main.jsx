// main.jsx
//
// This is the ENTRY POINT of the React app — the first JavaScript file
// that runs in the browser.
//
// Its only job: mount the React app onto the HTML page.
// The HTML file (index.html) has a <div id="root"></div> — React
// takes over that div and renders everything inside it.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'   // Global styles — loads Tailwind + our dark navy base
import App from './App.jsx'

// createRoot: React 18's way of rendering. Connects React to the <div id="root">.
// StrictMode: a development helper that warns you about potential problems.
//   It runs some checks twice in dev mode. Has NO effect in production.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)

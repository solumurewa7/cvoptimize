// pages/NotFoundPage.jsx — 404 Not Found

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEO from '../components/SEO'

export default function NotFoundPage() {
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
      <SEO title="Page Not Found" noIndex />
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', position: 'relative' }}
      >
        <div style={{
          fontSize: 'clamp(5rem, 20vw, 8rem)',
          fontWeight: 800,
          color: 'var(--accent)',
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: '16px',
        }}>
          404
        </div>

        <h1 style={{
          fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '0 0 12px',
        }}>
          Page not found
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          margin: '0 0 36px',
          lineHeight: 1.6,
          maxWidth: '320px',
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="cv-btn" style={{ textDecoration: 'none' }}>
            ← Go home
          </Link>
          <Link to="/dashboard" className="cv-btn-ghost" style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

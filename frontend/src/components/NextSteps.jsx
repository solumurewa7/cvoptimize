// components/NextSteps.jsx — tasteful "Recommended next steps" block (affiliate links).
//
// Rendered at the bottom of the Job Match and Improve results. Visually secondary so it
// never undercuts the product. Links are paid/affiliate, so they carry rel="sponsored"
// and a clear disclosure line (FTC compliance). Links come from utils/affiliateLinks.js.

import { motion } from 'framer-motion'
import { AFFILIATE_LINKS } from '../utils/affiliateLinks'

const EASE = [0.22, 1, 0.36, 1]

const INTRO = {
  match: 'Boost your chances on this role:',
  improve: 'Take your resume further:',
}

export default function NextSteps({ variant = 'match' }) {
  if (!AFFILIATE_LINKS.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
      style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--navy-700)',
        borderRadius: '14px',
        padding: '20px 22px',
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 2px',
        }}>
          Recommended next steps
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0, opacity: 0.85 }}>
          {INTRO[variant] || INTRO.match}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {AFFILIATE_LINKS.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'var(--navy-800)', border: '1px solid var(--navy-700)',
              borderRadius: '10px', padding: '12px 14px', textDecoration: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--navy-700)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--navy-700)'; e.currentTarget.style.background = 'var(--navy-800)' }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              background: 'rgba(59,130,246,0.12)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={link.icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.86rem', fontWeight: 600, margin: '0 0 1px' }}>
                {link.title}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
                {link.description}
              </p>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        ))}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: '12px 0 0', opacity: 0.6, lineHeight: 1.5 }}>
        Some links are affiliate links — we may earn a commission at no extra cost to you.
      </p>
    </motion.div>
  )
}

function Icon({ name }) {
  if (name === 'template') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    )
  }
  if (name === 'course') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    )
  }
  // badge (default)
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  )
}

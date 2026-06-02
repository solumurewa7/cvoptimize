// pages/HistoryPage.jsx — full Job Match analysis history

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'

const EASE = [0.22, 1, 0.36, 1]
const BADGE_COLOR = { Strong: 'var(--success)', Medium: 'var(--warning)', Low: 'var(--danger)' }

export default function HistoryPage() {
  const navigate  = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    client.get('/api/analyses')
      .then(res => setAnalyses(res.data.analyses || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Job Match History" noIndex />
      <Navbar />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ marginBottom: '36px' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            ← Dashboard
          </Link>
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Job Match History
          </h1>
          {!loading && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {analyses.length === 0 ? 'No analyses yet.' : `${analyses.length} ${analyses.length === 1 ? 'analysis' : 'analyses'} — newest first`}
            </p>
          )}
        </motion.div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ height: '90px', borderRadius: '12px', background: 'var(--navy-900)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ background: 'var(--navy-900)', border: '1px dashed var(--navy-700)', borderRadius: '14px', padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 8px' }}>No analyses yet</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 20px' }}>
              Run a Job Match to see your history here.
            </p>
            <Link to="/analyze" className="cv-btn" style={{ textDecoration: 'none', fontSize: '0.875rem', padding: '10px 22px' }}>
              Run Job Match →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analyses.map((a, i) => (
              <HistoryRow key={a.id} analysis={a} delay={i * 0.03} onClick={() => navigate(`/analyses/${a.id}`)} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

function HistoryRow({ analysis: a, delay, onClick }) {
  const [hovered, setHovered] = useState(false)
  const badgeColor = BADGE_COLOR[a.fit_badge] || 'var(--text-secondary)'
  const date = new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = new Date(a.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--navy-800)' : 'var(--navy-900)',
        border: `1px solid ${hovered ? 'var(--navy-600)' : 'var(--navy-700)'}`,
        borderRadius: '12px',
        padding: '16px 18px',
        cursor: 'pointer',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        transition: 'all 0.15s',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
      }}
    >
      {/* Score circle */}
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: `2.5px solid ${badgeColor}`,
        background: `${badgeColor}12`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: badgeColor, lineHeight: 1 }}>{a.fit_score ?? '–'}</span>
        <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)', lineHeight: 1 }}>/ 100</span>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
            {[a.job_title, a.company].filter(Boolean).join(' \u2014 ') || 'Job Analysis'}
          </p>
          <span style={{
            background: `${badgeColor}18`, color: badgeColor,
            border: `1px solid ${badgeColor}33`,
            borderRadius: '999px', padding: '1px 8px',
            fontSize: '0.68rem', fontWeight: 600,
          }}>
            {a.fit_badge}
          </span>
        </div>
        {a.jd_snippet && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 6px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.jd_snippet}
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {a.resume_filename && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{a.resume_filename}</span>
          )}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', opacity: 0.7 }}>{date} · {time}</span>
          <span style={{ color: 'var(--success)', fontSize: '0.72rem' }}>✓ {a.strengths_count}</span>
          <span style={{ color: 'var(--danger)',  fontSize: '0.72rem' }}>✗ {a.gaps_count}</span>
          <span style={{ color: 'var(--accent)',  fontSize: '0.72rem' }}>⬡ {a.matched_skills_count}</span>
        </div>
      </div>

      {/* Arrow */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={hovered ? 'var(--accent)' : 'var(--navy-600)'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: '4px', transition: 'stroke 0.15s' }}>
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    </motion.div>
  )
}

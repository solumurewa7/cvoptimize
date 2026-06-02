// pages/AnalysisDetailPage.jsx — full view of a single saved Job Match analysis

import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import AnalysisResult from '../components/AnalysisResult'

const EASE = [0.22, 1, 0.36, 1]

export default function AnalysisDetailPage() {
  const { id } = useParams()
  const [analysis, setAnalysis]   = useState(null)
  const [loading,  setLoading]    = useState(true)
  const [showJD,   setShowJD]     = useState(false)

  useEffect(() => {
    client.get(`/api/analyses/${id}`)
      .then(res => setAnalysis(res.data.analysis))
      .catch(() => toast.error('Could not load analysis'))
      .finally(() => setLoading(false))
  }, [id])

  const date = analysis
    ? new Date(analysis.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const time = analysis
    ? new Date(analysis.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Analysis" noIndex />
      <Navbar />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Back link */}
        <Link to="/history" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}>
          ← History
        </Link>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[80, 200, 160].map((h, i) => (
              <div key={i} style={{ height: h, borderRadius: '12px', background: 'var(--navy-900)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
          </div>
        ) : !analysis ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-secondary)' }}>
            Analysis not found.
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>

            {/* Page header */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                History · Analysis
              </p>
              <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 10px' }}>
                {[analysis.job_title, analysis.company].filter(Boolean).join(' \u2014 ') || 'Job Analysis'}
              </h1>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                {analysis.resume_filename && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{analysis.resume_filename}</span>
                  </span>
                )}
                <span style={{ color: 'var(--navy-600)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{date} · {time}</span>
              </div>
            </div>

            {/* Analysis result */}
            <AnalysisResult result={analysis} />

            {/* Collapsible job description */}
            <div style={{ marginTop: '20px', background: 'var(--navy-900)', border: '1px solid var(--navy-700)', borderRadius: '12px', overflow: 'hidden' }}>
              <button
                onClick={() => setShowJD(v => !v)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                Show full job description
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: showJD ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showJD && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ borderTop: '1px solid var(--navy-700)', padding: '16px 18px' }}
                >
                  <pre style={{
                    color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.7,
                    margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                    overflowWrap: 'break-word', wordBreak: 'break-word', overflowX: 'hidden',
                  }}>
                    {analysis.job_description}
                  </pre>
                </motion.div>
              )}
            </div>

          </motion.div>
        )}

      </main>
    </div>
  )
}

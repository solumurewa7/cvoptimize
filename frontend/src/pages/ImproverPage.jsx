// pages/ImproverPage.jsx — AI resume improvement tool
//
// Dual flow:
//   Guest:  upload file → POST /api/improve/guest (multipart) → result in memory
//   Authed: upload file → POST /api/resumes/upload → resume.id →
//           POST /api/improve { resume_id } → result saved to DB

import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import ScoreRing from '../components/ScoreRing'
import AnalysisProgress from '../components/AnalysisProgress'
import NextSteps from '../components/NextSteps'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { RESUME_COLORS } from '../utils/resumeColors'

const EASE = [0.22, 1, 0.36, 1]

const IMPROVE_MESSAGES = [
  'Reading your resume…',
  'Reviewing structure and wording…',
  'Finding improvement opportunities…',
  'Writing suggestions…',
  'Almost there…',
]

export default function ImproverPage() {
  const { user }    = useAuth()
  const location    = useLocation()
  const isGuest     = !user
  const isMobile    = useIsMobile()

  // Pre-fill if navigated from dashboard with a resume
  const prefilled = location.state?.resume || null

  const [resume,     setResume]     = useState(prefilled)   // authed: resume object {id, filename, …}
  const [guestFile,  setGuestFile]  = useState(null)        // guest:  File object
  const [uploading,  setUploading]  = useState(false)       // file being uploaded to /api/resumes/upload
  const [analysing,  setAnalysing]  = useState(false)       // AI call in progress
  const [result,     setResult]     = useState(null)        // improvement result dict
  const [savedResumes, setSavedResumes] = useState([])      // auth only

  // Load saved resumes for auth users so they can pick one
  useEffect(() => {
    if (!isGuest) {
      client.get('/api/resumes')
        .then(res => setSavedResumes(res.data.resumes || []))
        .catch(() => {})
    }
  }, [isGuest])

  // ── File drop handler ──────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return

    if (isGuest) {
      setGuestFile(file)
      setResume(null)
      setResult(null)
      return
    }

    // Auth: upload immediately so we have a resume_id
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await client.post('/api/resumes/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResume(res.data.resume)
      setResult(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [isGuest])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDropRejected: (files) => {
      const err = files[0]?.errors[0]
      if (err?.code === 'file-too-large') toast.error('File exceeds 5 MB limit')
      else toast.error('Only PDF and DOCX files are accepted')
    },
  })

  // ── Run analysis ───────────────────────────────────────────────────────────
  async function handleRun() {
    if (isGuest) {
      if (!guestFile) { toast.error('Please upload your resume first'); return }
      setAnalysing(true)
      try {
        const fd = new FormData()
        fd.append('file', guestFile)
        const res = await client.post('/api/improve/guest', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setResult(res.data.improvement)
      } catch (err) {
        toast.error(err.response?.data?.error || 'Analysis failed')
      } finally {
        setAnalysing(false)
      }
      return
    }

    // Auth
    if (!resume) { toast.error('Please select or upload a resume first'); return }
    setAnalysing(true)
    try {
      const res = await client.post('/api/improve', { resume_id: resume.id })
      setResult(res.data.improvement)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally {
      setAnalysing(false)
    }
  }

  const hasFile = isGuest ? !!guestFile : !!resume
  const filename = isGuest ? guestFile?.name : resume?.filename

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Improve Your CV" description="Get AI-powered suggestions to strengthen your resume — better phrasing, stronger impact statements, and skills to highlight." path="/improve" />
      <Navbar />

      {/* Guest banner */}
      {isGuest && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          borderBottom: '1px solid rgba(245,158,11,0.18)',
          padding: '10px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '0.82rem', color: 'var(--warning)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          You're using guest mode — results won't be saved.
          <Link to="/register" style={{ color: 'var(--warning)', fontWeight: 700, textDecoration: 'underline' }}>
            Sign up free
          </Link>
          to keep your history.
        </div>
      )}

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '28px 16px 60px' : '48px 24px 80px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ marginBottom: '36px', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            CV Tools · Improve
          </p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--text-primary)', margin: '0 0 10px' }}>
            Improve your CV
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '460px', marginInline: 'auto' }}>
            Upload your resume and our AI will score it, highlight what's working, and give specific rewrite suggestions.
          </p>
        </motion.div>

        {/* ── Upload card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: EASE }}
          style={{
            background: 'var(--navy-900)',
            border: '1px solid var(--navy-700)',
            borderRadius: '16px',
            padding: isMobile ? '18px 16px' : '28px',
            marginBottom: '20px',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Your Resume
          </p>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : hasFile ? 'var(--success)' : 'var(--navy-700)'}`,
              borderRadius: '10px',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'rgba(59,130,246,0.05)' : hasFile ? 'rgba(34,197,94,0.04)' : 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <input {...getInputProps()} disabled={uploading} />
            {uploading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Uploading…
              </div>
            ) : hasFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>{filename}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>· click to change</span>
              </div>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 4px' }}>
                  {isDragActive ? 'Drop it here' : 'Drop your resume here'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                  PDF or DOCX · max 5 MB
                </p>
              </>
            )}
          </div>

          {/* Saved resumes picker — auth only */}
          {!isGuest && savedResumes.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 8px', textAlign: 'center' }}>
                — or pick a saved resume —
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {savedResumes.map(r => {
                  const isSelected = resume?.id === r.id
                  const colorStyle = r.color && RESUME_COLORS[r.color]
                    ? { background: RESUME_COLORS[r.color].bg, borderColor: isSelected ? RESUME_COLORS[r.color].dot : RESUME_COLORS[r.color].border, borderLeftColor: RESUME_COLORS[r.color].dot, borderLeftWidth: '3px' }
                    : { background: isSelected ? 'rgba(59,130,246,0.12)' : 'var(--navy-800)', borderColor: isSelected ? 'var(--accent)' : 'var(--navy-700)' }
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setResume(r); setResult(null) }}
                      style={{
                        ...colorStyle,
                        borderStyle: 'solid', borderWidth: '1px',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.custom_name || r.filename}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── CTA button ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <button
            onClick={handleRun}
            disabled={analysing || uploading || !hasFile}
            className="cv-btn"
            style={{
              padding: '13px 36px',
              fontSize: '0.95rem',
              opacity: (analysing || uploading || !hasFile) ? 0.55 : 1,
              cursor: (analysing || uploading || !hasFile) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {analysing ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Analysing…
              </>
            ) : (
              'Improve my CV →'
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

          <AnimatePresence>
            {analysing && (
              <AnalysisProgress
                key="improve-progress"
                messages={IMPROVE_MESSAGES}
                style={{ maxWidth: '360px', margin: '0 auto' }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <ImprovementResult result={result} />

              {/* Guest CTA */}
              {isGuest && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
                  style={{
                    marginTop: '32px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(29,78,216,0.08) 100%)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '16px',
                    padding: '28px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: '0 0 8px' }}>
                    Save these results
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 20px' }}>
                    Create a free account to keep your improvement history and track progress over time.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="cv-btn" style={{ textDecoration: 'none', padding: '9px 22px', fontSize: '0.875rem' }}>
                      Sign up free →
                    </Link>
                    <Link to="/login" className="cv-btn-ghost" style={{ textDecoration: 'none', padding: '9px 22px', fontSize: '0.875rem' }}>
                      Sign in
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}

// ─── Parse "Before: ... After: ..." strings from Gemini ──────────────────────
function parseBeforeAfter(text) {
  if (!text) return null
  const lc = text.toLowerCase()
  const beforeIdx = lc.indexOf('before:')
  const afterIdx  = lc.indexOf('after:')
  if (beforeIdx !== -1 && afterIdx !== -1 && afterIdx > beforeIdx) {
    let before = text.slice(beforeIdx + 7, afterIdx).trim().replace(/^["'"']+|["'"']+$/g, '').trim()
    let after  = text.slice(afterIdx  + 6).trim().replace(/^["'"']+|["'"']+$/g, '').trim()
    if (before && after) return { before, after }
  }
  return null
}

// ─── Improvement result display ───────────────────────────────────────────────
function ImprovementResult({ result }) {
  const { overall_score, overall_badge, summary, strengths, improvements, missing_elements, ats_tips } = result

  // Derive both the ring badge and text color from the score so they always match
  const ringBadge  = overall_score >= 70 ? 'Strong' : overall_score >= 40 ? 'Medium' : 'Low'
  const badgeColor = ringBadge === 'Strong' ? 'var(--success)' : ringBadge === 'Medium' ? 'var(--warning)' : 'var(--danger)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Score card */}
      <ResultCard delay={0}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', flexWrap: 'wrap' }}>
          <ScoreRing score={overall_score} badge={ringBadge} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            {/* Badge as a prominent coloured heading, naturally aligned with text below */}
            <p style={{
              color: badgeColor,
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              margin: '4px 0 10px',
              lineHeight: 1,
            }}>
              {overall_badge}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
              {summary}
            </p>
          </div>
        </div>
      </ResultCard>

      {/* Strengths */}
      {strengths.length > 0 && (
        <ResultCard delay={0.05}>
          <SectionHeader icon="✓" color="var(--success)" title="What's working" count={strengths.length} />
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {strengths.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '2px', flexShrink: 0 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{s}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <ResultCard delay={0.1}>
          <SectionHeader icon="↑" color="var(--accent)" title="Improvement suggestions" count={improvements.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {improvements.map((item, i) => {
              const parsed = parseBeforeAfter(item.example_rewrite)
              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--navy-950)',
                    border: '1px solid var(--navy-700)',
                    borderLeft: '3px solid var(--accent)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  {/* Area tag + issue */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(59,130,246,0.12)',
                      color: 'var(--accent)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}>
                      {item.area}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 10px' }}>
                    {item.issue}
                  </p>

                  {/* Before / After */}
                  {parsed ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px',
                    }}>
                      {/* Before */}
                      <div style={{
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}>
                        <p style={{
                          color: 'var(--danger)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          margin: '0 0 6px',
                        }}>
                          Before
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                          {parsed.before}
                        </p>
                      </div>
                      {/* After */}
                      <div style={{
                        background: 'rgba(34,197,94,0.05)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                      }}>
                        <p style={{
                          color: 'var(--success)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          margin: '0 0 6px',
                        }}>
                          After
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                          {parsed.after}
                        </p>
                      </div>
                    </div>
                  ) : item.example_rewrite ? (
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      lineHeight: 1.65,
                      margin: 0,
                      fontStyle: 'italic',
                      borderTop: '1px solid var(--navy-700)',
                      paddingTop: '8px',
                    }}>
                      {item.example_rewrite}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </ResultCard>
      )}

      {/* Missing elements */}
      {missing_elements.length > 0 && (
        <ResultCard delay={0.15}>
          <SectionHeader icon="!" color="var(--warning)" title="Missing elements" count={missing_elements.length} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {missing_elements.map((m, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  color: 'var(--warning)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  borderRadius: '999px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </ResultCard>
      )}

      {/* Formatting Tips (renamed from ATS tips) */}
      {ats_tips.length > 0 && (
        <ResultCard delay={0.2}>
          <SectionHeader icon="⚙" color="var(--text-secondary)" title="Formatting Tips" count={ats_tips.length} />
          <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ats_tips.map((tip, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '2px', flexShrink: 0 }}>→</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{tip}</span>
              </li>
            ))}
          </ul>
        </ResultCard>
      )}

      {/* ── Recommended next steps ── */}
      <NextSteps variant="improve" />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ResultCard({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--navy-700)',
        borderRadius: '14px',
        padding: '22px 24px',
      }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeader({ icon, color, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{
        width: 28, height: 28,
        background: `${color}18`,
        color,
        borderRadius: '7px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
      }}>
        {icon}
      </span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>{title}</span>
      <span style={{
        marginLeft: 'auto',
        background: 'var(--navy-800)',
        color: 'var(--text-secondary)',
        borderRadius: '999px',
        padding: '1px 9px',
        fontSize: '0.72rem',
        fontWeight: 600,
      }}>
        {count}
      </span>
    </div>
  )
}

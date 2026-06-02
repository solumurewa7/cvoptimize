// pages/AnalyzePage.jsx — 3-step CV analyser (works for guests & authed users)
//
// Guest users:  file held in state → POST /api/analyses/guest (multipart) → result, no DB save
// Authed users: POST /api/resumes/upload → resume_id → POST /api/analyses → result saved to DB

import { useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import AnalysisResult from '../components/AnalysisResult'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { RESUME_COLORS } from '../utils/resumeColors'

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const { user } = useAuth()
  const location  = useLocation()
  const isGuest   = !user
  const isMobile  = useIsMobile()

  // Authed flow: resume object from DB (has .id)
  const [resume,    setResume]    = useState(null)
  const [uploading, setUploading] = useState(false)
  // Guest flow: File object held in memory
  const [guestFile, setGuestFile] = useState(null)

  const [jdText,       setJdText]       = useState('')
  const [analysing,    setAnalysing]    = useState(false)
  const [result,       setResult]       = useState(null)
  const [savedResumes, setSavedResumes] = useState([])
  const [jdHistory,    setJdHistory]    = useState([])
  const [jdHistOpen,   setJdHistOpen]   = useState(false)

  // Pre-fill resume when navigated from Dashboard with state
  useEffect(() => {
    if (!isGuest && location.state?.resume) {
      setResume(location.state.resume)
    }
  }, [isGuest, location.state])

  // Load saved resumes + JD history for auth users
  useEffect(() => {
    if (!isGuest) {
      client.get('/api/resumes')
        .then(res => setSavedResumes(res.data.resumes || []))
        .catch(() => {})
      client.get('/api/analyses/jd-history')
        .then(res => setJdHistory(res.data.jd_history || []))
        .catch(() => {})
    }
  }, [isGuest])

  // ── Drop handler ──────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Only PDF and DOCX files are supported')
      return
    }

    if (isGuest) {
      // Guest: just store the file locally, no upload yet
      setGuestFile(file)
      setResult(null)
      return
    }

    // Authed: upload now and get a resume_id
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const res = await client.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResume(res.data.resume)
      setResult(null)
      toast.success(`Resume uploaded — ${res.data.resume.word_count} words extracted`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [isGuest])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    disabled: uploading,
  })

  // ── Analyse ───────────────────────────────────────────────────────────────
  async function handleAnalyse() {
    if (jdText.trim().length < 50) {
      toast.error('Job description is too short')
      return
    }

    if (isGuest) {
      if (!guestFile) { toast.error('Upload a resume first'); return }
      setAnalysing(true)
      try {
        const fd = new FormData()
        fd.append('file', guestFile)
        fd.append('job_description', jdText)
        // Use plain fetch so axios doesn't set Content-Type (browser sets multipart boundary)
        const res = await client.post('/api/analyses/guest', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        setResult(res.data.analysis)
      } catch (err) {
        toast.error(err.response?.data?.error || 'Analysis failed')
      } finally {
        setAnalysing(false)
      }
      return
    }

    // Authed flow
    if (!resume) { toast.error('Upload a resume first'); return }
    setAnalysing(true)
    try {
      const res = await client.post('/api/analyses', {
        resume_id: resume.id,
        job_description: jdText,
      })
      setResult(res.data.analysis)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed')
    } finally {
      setAnalysing(false)
    }
  }

  const hasFile = isGuest ? !!guestFile : !!resume

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Job Match" description="Check how well your resume fits any job description. Get an instant AI fit score, matched skills, and gaps." path="/analyze" />
      <Navbar />

      {/* ── Guest banner ──────────────────────────────────────────────────── */}
      {isGuest && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          padding: '10px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ color: 'var(--warning)', fontSize: '0.825rem', fontWeight: 500 }}>
            Guest mode — results won't be saved.
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign up free
            </Link>
            {' '}to keep your history.
          </span>
        </div>
      )}

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '28px 16px 60px' : '48px 24px 80px' }}>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: '36px', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            CV Tools · Job Match
          </p>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.035em',
            color: 'var(--text-primary)', margin: '0 0 10px',
          }}>
            Job Match
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', maxWidth: '460px', marginInline: 'auto' }}>
            Upload your CV and paste a job description — get an instant fit score with matched and missing skills.
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Step 1: Upload ──────────────────────────────────────────── */}
          <StepCard step={1} title="Upload your resume" delay={0.05}>
            <DropZone
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              uploading={uploading}
              resume={resume}
              guestFile={guestFile}
              isGuest={isGuest}
            />
            {/* Saved resume picker — auth users only */}
            {!isGuest && savedResumes.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 8px', textAlign: 'center' }}>
                  — or pick a saved resume —
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {savedResumes.map(r => {
                    const isSelected = resume?.id === r.id
                    const colorStyle = r.color && RESUME_COLORS[r.color]
                      ? { background: isSelected ? RESUME_COLORS[r.color].bg : RESUME_COLORS[r.color].bg, borderColor: isSelected ? RESUME_COLORS[r.color].dot : RESUME_COLORS[r.color].border, borderLeftColor: RESUME_COLORS[r.color].dot, borderLeftWidth: '3px' }
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
          </StepCard>

          {/* ── Step 2: Job description ─────────────────────────────────── */}
          <StepCard step={2} title="Paste the job description" delay={0.1}>
            {/* JD history — auth users with past analyses */}
            {!isGuest && jdHistory.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <button
                  onClick={() => setJdHistOpen(o => !o)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
                    padding: 0, display: 'flex', alignItems: 'center', gap: '5px',
                    fontFamily: 'inherit',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.2s', transform: jdHistOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  Recent job descriptions
                </button>
                <AnimatePresence>
                  {jdHistOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
                        {jdHistory.map(jd => (
                          <button
                            key={jd.id}
                            onClick={() => { setJdText(jd.job_description); setJdHistOpen(false) }}
                            style={{
                              background: 'var(--navy-800)', border: '1px solid var(--navy-700)',
                              borderRadius: '8px', padding: '8px 12px', cursor: 'pointer',
                              textAlign: 'left', fontFamily: 'inherit', transition: 'border-color 0.15s',
                              display: 'flex', flexDirection: 'column', gap: '2px',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--navy-700)'}
                          >
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                              {jd.job_title || 'Untitled role'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {jd.jd_snippet}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <textarea
              className="cv-input"
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here — include responsibilities, requirements, and nice-to-haves for the best results…"
              rows={isMobile ? 6 : 9}
              style={{ resize: 'vertical', lineHeight: 1.65, fontSize: '0.88rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
              <button
                onClick={handleAnalyse}
                disabled={analysing || !hasFile}
                className="cv-btn"
                style={{ minWidth: '150px' }}
              >
                {analysing ? <><Spinner /> Analysing…</> : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Analyse fit
                  </>
                )}
              </button>
              {analysing && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}
                >
                  Loading AI models on first run — ~5 seconds…
                </motion.p>
              )}
              {jdText.trim().length > 0 && jdText.trim().length < 50 && !analysing && (
                <span style={{ color: 'var(--warning)', fontSize: '0.82rem' }}>
                  Paste a longer job description for accurate results
                </span>
              )}
            </div>
          </StepCard>

          {/* ── Step 3: Results ─────────────────────────────────────────── */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepCard step={3} title="Analysis results" delay={0}>
                  <AnalysisResult result={result} />
                </StepCard>

                {/* Guest save CTA */}
                {isGuest && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    style={{
                      marginTop: '16px',
                      background: 'rgba(59,130,246,0.07)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '14px',
                      padding: '24px 28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem' }}>
                        Save these results
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                        Create a free account to build your analysis history and track progress.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <Link to="/login"    className="cv-btn-ghost" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>Sign in</Link>
                      <Link to="/register" className="cv-btn"       style={{ textDecoration: 'none', fontSize: '0.875rem', padding: '9px 20px' }}>Sign up free</Link>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  )
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ step, title, delay, children }) {
  const isMobile = useIsMobile()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="cv-card"
      style={{ padding: isMobile ? '18px 16px' : '28px 30px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: 26, height: 26, borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
        }}>
          {step}
        </div>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ getRootProps, getInputProps, isDragActive, uploading, resume, guestFile, isGuest }) {
  const displayFile = isGuest
    ? (guestFile ? { filename: guestFile.name, word_count: null } : null)
    : resume

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'var(--accent)' : displayFile ? 'rgba(34,197,94,0.4)' : 'var(--navy-700)'}`,
        borderRadius: '12px',
        padding: '36px 24px',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: isDragActive
          ? 'rgba(59,130,246,0.06)'
          : displayFile ? 'rgba(34,197,94,0.04)' : 'var(--navy-800)',
        transition: 'all 0.2s ease',
      }}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: 40, height: 40 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--navy-700)" strokeWidth="3"/>
              <motion.circle
                cx="20" cy="20" r="16" fill="none" stroke="var(--accent)" strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 16}
                initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 1.4, ease: 'linear', repeat: Infinity }}
              />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Uploading & extracting text…</p>
        </div>
      ) : displayFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'rgba(34,197,94,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ color: 'var(--success)', margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>
            {displayFile.filename}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            {displayFile.word_count ? `${displayFile.word_count.toLocaleString()} words extracted · ` : ''}
            Drop a new file to replace
          </p>
          {isGuest && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '4px 0 0', fontStyle: 'italic' }}>
              File ready — will be sent when you click Analyse
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '14px',
            background: isDragActive ? 'rgba(59,130,246,0.15)' : 'var(--navy-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s', marginBottom: '4px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={isDragActive ? 'var(--accent)' : 'var(--text-secondary)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'stroke 0.2s' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div>
            <p style={{ color: isDragActive ? 'var(--accent)' : 'var(--text-primary)', margin: '0 0 4px', fontWeight: 500, transition: 'color 0.2s' }}>
              {isDragActive ? 'Drop it here' : 'Drag & drop your resume'}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              PDF or DOCX · max 5 MB · or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse files</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><path d="M12 2a10 10 0 0 1 10 10" opacity="0.4"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> }

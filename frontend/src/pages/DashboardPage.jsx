// pages/DashboardPage.jsx — authenticated hub: tools + saved resumes

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import { useAuth } from '../context/AuthContext'
import { useTypewriter } from '../hooks/useTypewriter'
import { RESUME_COLORS } from '../utils/resumeColors'

const EASE = [0.22, 1, 0.36, 1]
const BADGE_COLOR = { Strong: 'var(--success)', Medium: 'var(--warning)', Low: 'var(--danger)' }

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [resumes,      setResumes]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)   // resume object pending delete
  const [deleting,     setDeleting]     = useState(false)  // spinner on delete button
  const [showUpload,   setShowUpload]   = useState(false)  // upload modal

  function handleResumeUploaded(resume) {
    setResumes(prev => [resume, ...prev])
    setShowUpload(false)
  }

  function handleResumePatched(updated) {
    setResumes(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  useEffect(() => {
    client.get('/api/resumes')
      .then(res => setResumes(res.data.resumes || []))
      .catch(() => toast.error('Could not load saved resumes'))
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const typedName = useTypewriter(firstName, { loop: false, typeMs: 70 })

  function handleDelete(resume) {
    if (localStorage.getItem('cv_skip_delete_confirm') === 'true') {
      confirmDelete(resume)
      return
    }
    setDeleteTarget(resume)
  }

  async function confirmDelete(resume) {
    setDeleting(true)
    try {
      await client.delete(`/api/resumes/${resume.id}`)
      setResumes(prev => prev.filter(r => r.id !== resume.id))
      toast.success('Resume deleted')
    } catch {
      toast.error('Could not delete resume')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO title="Dashboard" noIndex />
      <Navbar />
      {user && !user.is_verified && <VerificationBanner />}
      <style>{`
        .dashboard-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }
        @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .dashboard-main { padding: 32px 16px 60px !important; } }
      `}</style>

      <main className="dashboard-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Welcome header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ marginBottom: '44px' }}
        >
          <p style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--text-primary)', margin: '0 0 10px' }}>
            {typedName}
            <span style={{
              display: 'inline-block',
              width: '2px',
              height: '0.8em',
              background: 'var(--accent)',
              marginLeft: '2px',
              verticalAlign: 'middle',
              borderRadius: '1px',
              animation: typedName.length < firstName.length ? 'blink 0.7s step-end infinite' : 'none',
              opacity: typedName.length < firstName.length ? 1 : 0,
            }} />
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {/* ── Two-column grid ─────────────────────────────────────────────── */}
        <div className="dashboard-grid">

          {/* ── Left column ── */}
          <div>
            {/* Tools */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06, ease: EASE }} style={{ marginBottom: '48px' }}>
              <SectionLabel>CV Tools</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <ToolCard icon={<SearchIcon />} title="Job Match" description="Check how well your CV fits a role — get a fit score, matched skills, and gaps." tag="Available" tagColor="var(--success)" onClick={() => navigate('/analyze')} />
                <ToolCard icon={<SparklesIcon />} title="Improve your CV" description="AI suggestions to strengthen phrasing and highlight key skills." tag="Available" tagColor="var(--success)" onClick={() => navigate('/improve')} />
              </div>
            </motion.div>

            {/* Saved resumes */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12, ease: EASE }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <SectionLabel style={{ margin: 0 }}>Saved Resumes</SectionLabel>
                <button className="cv-btn-ghost" onClick={() => setShowUpload(true)} style={{ padding: '5px 14px', fontSize: '0.8rem' }}>
                  + Upload new
                </button>
              </div>
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                  {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 0.05} />)}
                </div>
              ) : resumes.length === 0 ? (
                <EmptyResumes onUpload={() => setShowUpload(true)} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                  {resumes.map((resume, i) => (
                    <ResumeCard key={resume.id} resume={resume} delay={i * 0.04} onUse={() => navigate('/analyze', { state: { resume } })} onDelete={() => handleDelete(resume)} onPatched={handleResumePatched} />
                  ))}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: resumes.length * 0.04 }}
                    onClick={() => setShowUpload(true)}
                    style={{ background: 'transparent', border: '2px dashed var(--navy-700)', borderRadius: '12px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', transition: 'border-color 0.15s, color 0.15s, background 0.15s', minHeight: '120px' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(59,130,246,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--navy-700)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Upload new resume
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right column: Analysis History ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16, ease: EASE }}>
            <HistoryPanel />
          </motion.div>

        </div>
      </main>

      <DeleteModal resume={deleteTarget} deleting={deleting} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={handleResumeUploaded} />
    </div>
  )
}

// ─── History panel ────────────────────────────────────────────────────────────
function HistoryPanel() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    client.get('/api/analyses')
      .then(res => setAnalyses((res.data.analyses || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px solid var(--navy-700)',
      borderRadius: '16px',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Recent Analyses
        </p>
        {analyses.length > 0 && (
          <Link to="/history" style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: '76px', borderRadius: '10px', background: 'var(--navy-800)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
          <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
        </div>
      ) : analyses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 12px', lineHeight: 1.6 }}>
            No analyses yet — run a Job Match to see your history here.
          </p>
          <Link to="/analyze" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Run Job Match →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {analyses.map((a, i) => (
            <HistoryCard key={a.id} analysis={a} delay={i * 0.04} onClick={() => navigate(`/analyses/${a.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── History card ──────────────────────────────────────────────────────────────
function HistoryCard({ analysis: a, delay = 0, onClick }) {
  const [hovered, setHovered] = useState(false)
  const badgeColor = BADGE_COLOR[a.fit_badge] || 'var(--text-secondary)'
  const d    = new Date(a.created_at)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--navy-800)' : 'transparent',
        border: `1px solid ${hovered ? 'var(--navy-600)' : 'var(--navy-700)'}`,
        borderRadius: '10px',
        padding: '12px',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Top row: score circle + text */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Compact score circle */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: `2.5px solid ${badgeColor}`,
          background: `${badgeColor}12`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: badgeColor, lineHeight: 1 }}>{a.fit_score ?? '–'}</span>
          <span style={{ fontSize: '0.48rem', color: 'var(--text-secondary)', lineHeight: 1 }}>/ 100</span>
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.825rem', margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {a.job_title || 'Job Analysis'}
          </p>
          {a.jd_snippet && (
            <p style={{
              color: 'var(--text-secondary)', fontSize: '0.73rem', margin: '0 0 4px', lineHeight: 1.45,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {a.jd_snippet}
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', margin: 0, opacity: 0.7 }}>
            {a.resume_filename && <span>{a.resume_filename} · </span>}{date} · {time}
          </p>
        </div>
      </div>

      {/* Hover: mini stats + see more */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--navy-700)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>✓ {a.strengths_count}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>✗ {a.gaps_count}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>⬡ {a.matched_skills_count}</span>
              </div>
              <span style={{ color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600 }}>See more →</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Tool card ────────────────────────────────────────────────────────────────
function ToolCard({ icon, title, description, tag, tagColor, onClick, disabled }) {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      style={{
        background: 'var(--navy-900)',
        border: `1px solid ${disabled ? 'var(--navy-700)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '14px',
        padding: '24px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.65 : 1,
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.15)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = disabled ? 'var(--navy-700)' : 'rgba(255,255,255,0.07)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: 'var(--navy-800)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          {icon}
        </div>
        <span style={{
          background: `${tagColor}18`,
          color: tagColor,
          border: `1px solid ${tagColor}33`,
          borderRadius: '999px',
          padding: '2px 10px',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}>
          {tag}
        </span>
      </div>
      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {title}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.65, margin: 0 }}>
          {description}
        </p>
      </div>
      {!disabled && (
        <p style={{ color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
          Open →
        </p>
      )}
    </button>
  )
}

// ─── Resume card ──────────────────────────────────────────────────────────────
function ResumeCard({ resume, delay, onUse, onDelete, onPatched }) {
  const ext = resume.filename.split('.').pop().toUpperCase()
  const d = new Date(resume.created_at)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(resume.custom_name || '')
  const nameInputRef = useRef(null)

  const colorStyle = resume.color && RESUME_COLORS[resume.color]
    ? { background: RESUME_COLORS[resume.color].bg, border: `1px solid ${RESUME_COLORS[resume.color].border}`, borderLeft: `3px solid ${RESUME_COLORS[resume.color].dot}` }
    : { background: 'var(--navy-900)', border: '1px solid var(--navy-700)' }

  function openPreview() {
    const base = import.meta.env.VITE_API_URL || ''
    window.open(`${base}/api/resumes/${resume.id}/file`, '_blank', 'noopener,noreferrer')
  }

  async function patchColor(color) {
    const newColor = color === resume.color ? null : color
    const optimistic = { ...resume, color: newColor }
    onPatched(optimistic)
    try {
      const res = await client.patch(`/api/resumes/${resume.id}`, { color: newColor })
      onPatched(res.data.resume)
    } catch {
      onPatched(resume) // roll back
      toast.error('Could not update color')
    }
  }

  async function saveName() {
    setEditing(false)
    const newName = nameVal.trim() || null
    if (newName === (resume.custom_name || null)) return
    const optimistic = { ...resume, custom_name: newName }
    onPatched(optimistic)
    try {
      const res = await client.patch(`/api/resumes/${resume.id}`, { custom_name: newName })
      onPatched(res.data.resume)
    } catch {
      onPatched(resume)
      setNameVal(resume.custom_name || '')
      toast.error('Could not update label')
    }
  }

  useEffect(() => {
    if (editing && nameInputRef.current) nameInputRef.current.focus()
  }, [editing])

  const displayName = resume.custom_name || resume.filename

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        ...colorStyle,
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* File icon + name + delete button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Icon — clickable if file is available */}
        <button
          onClick={resume.has_file ? openPreview : undefined}
          title={resume.has_file ? 'Preview file' : undefined}
          style={{
            width: 36, height: 36, borderRadius: '8px',
            background: resume.has_file ? 'rgba(59,130,246,0.1)' : 'var(--navy-800)',
            border: resume.has_file ? '1px solid rgba(59,130,246,0.2)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: resume.has_file ? 'pointer' : 'default',
            padding: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (resume.has_file) e.currentTarget.style.background = 'rgba(59,130,246,0.2)' }}
          onMouseLeave={e => { if (resume.has_file) e.currentTarget.style.background = 'rgba(59,130,246,0.1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={resume.has_file ? 'var(--accent)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name — click pencil to edit */}
          {editing ? (
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditing(false); setNameVal(resume.custom_name || '') } }}
              maxLength={100}
              placeholder={resume.filename}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--accent)',
                borderRadius: '5px', color: 'var(--text-primary)', fontSize: '0.825rem',
                fontWeight: 600, padding: '2px 6px', width: '100%', fontFamily: 'inherit',
                outline: 'none', marginBottom: '3px',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
              <p
                onClick={resume.has_file ? openPreview : undefined}
                style={{
                  color: resume.has_file ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '0.825rem', fontWeight: 600, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  cursor: resume.has_file ? 'pointer' : 'default',
                  textDecoration: resume.has_file ? 'underline' : 'none',
                  textDecorationColor: 'rgba(59,130,246,0.4)',
                  textUnderlineOffset: '2px',
                  flex: 1, minWidth: 0,
                }}
                title={resume.has_file ? 'Click to preview' : undefined}
              >
                {displayName}
              </p>
              <button
                onClick={() => { setNameVal(resume.custom_name || ''); setEditing(true) }}
                title="Edit label"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '1px', flexShrink: 0, display: 'flex', opacity: 0.6, transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
            {resume.word_count?.toLocaleString()} words · {ext}
          </p>
        </div>
        <TrashButton onClick={(e) => { e.stopPropagation(); onDelete() }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', margin: 0 }}>
          Uploaded {date} · {time}
        </p>
        {/* Color picker dots */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {Object.entries(RESUME_COLORS).map(([key, c]) => (
            <button
              key={key}
              onClick={() => patchColor(key)}
              title={key}
              style={{
                width: 12, height: 12, borderRadius: '50%',
                background: c.dot,
                border: resume.color === key ? `2px solid #fff` : '2px solid transparent',
                padding: 0, cursor: 'pointer', flexShrink: 0,
                outline: 'none', transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
          {resume.color && (
            <button
              onClick={() => patchColor(resume.color)}
              title="Remove color"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '1px', fontSize: '0.65rem', lineHeight: 1, opacity: 0.6, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onUse}
        style={{
          background: 'var(--navy-800)',
          border: '1px solid var(--navy-700)',
          borderRadius: '7px',
          color: 'var(--accent)',
          fontSize: '0.8rem',
          fontWeight: 600,
          padding: '7px 12px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'background 0.15s, border-color 0.15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--navy-800)'
          e.currentTarget.style.borderColor = 'var(--navy-700)'
        }}
      >
        Use in analysis →
      </button>
    </motion.div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--navy-700)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--navy-800)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, borderRadius: '4px', background: 'var(--navy-800)', marginBottom: '7px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: 10, borderRadius: '4px', background: 'var(--navy-800)', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ height: 10, borderRadius: '4px', background: 'var(--navy-800)', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 30, borderRadius: '7px', background: 'var(--navy-800)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`}</style>
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyResumes({ onUpload }) {
  return (
    <div style={{
      background: 'var(--navy-900)',
      border: '1px dashed var(--navy-700)',
      borderRadius: '14px',
      padding: '48px 32px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '14px',
        background: 'var(--navy-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 8px' }}>No resumes yet</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Upload a resume to start analysing your CV against job postings.
      </p>
      <button className="cv-btn" onClick={onUpload} style={{ fontSize: '0.875rem', padding: '10px 22px' }}>
        Upload first resume →
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children, style }) {
  return (
    <p style={{
      color: 'var(--text-secondary)',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: '0 0 14px',
      ...style,
    }}>
      {children}
    </p>
  )
}

// ─── Trash button ─────────────────────────────────────────────────────────────
function TrashButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Delete resume"
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        padding: '3px',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    </button>
  )
}

// ─── Verification banner ──────────────────────────────────────────────────────
function VerificationBanner() {
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function resend() {
    setSending(true)
    try {
      await client.post('/api/auth/resend-verification')
      setSent(true)
      toast.success('Verification email sent — check your inbox (and spam)')
    } catch {
      toast.error('Could not send email — try again later')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      borderBottom: '1px solid rgba(245,158,11,0.2)',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span style={{ color: 'var(--warning)', fontSize: '0.825rem', fontWeight: 500 }}>
        Please verify your email address to secure your account.
      </span>
      {!sent && (
        <button
          onClick={resend}
          disabled={sending}
          style={{
            background: 'none', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: '6px', padding: '3px 12px',
            color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600,
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: sending ? 0.6 : 1, fontFamily: 'inherit',
          }}
        >
          {sending ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  )
}

// ─── Upload modal ─────────────────────────────────────────────────────────────
function UploadModal({ open, onClose, onUploaded }) {
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState('')
  const [customName,   setCustomName]   = useState('')
  const [pickedColor,  setPickedColor]  = useState(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Reset state when modal reopens
  useEffect(() => {
    if (open) { setError(''); setCustomName(''); setPickedColor(null) }
  }, [open])

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return
    const file = accepted[0]
    setError('')
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    if (customName.trim()) form.append('custom_name', customName.trim())
    if (pickedColor)       form.append('color', pickedColor)
    try {
      const res = await client.post('/api/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Resume saved')
      onUploaded(res.data.resume)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed — try again')
    } finally {
      setUploading(false)
    }
  }, [onUploaded, customName, pickedColor])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="upload-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          />

          {/* Modal */}
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 201, pointerEvents: 'none', padding: '16px' }}>
            <motion.div
              key="upload-modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: EASE }}
              style={{
                pointerEvents: 'auto',
                background: 'var(--navy-900)',
                border: '1px solid var(--navy-700)',
                borderRadius: '16px',
                padding: '28px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: 0, letterSpacing: '-0.02em' }}>
                  Upload resume
                </h3>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex', borderRadius: '6px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--navy-600)'}`,
                  borderRadius: '12px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  background: isDragActive ? 'rgba(59,130,246,0.06)' : 'var(--navy-800)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <input {...getInputProps()} />

                {uploading ? (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                      style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Uploading…</p>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDragActive ? 'var(--accent)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ margin: '0 auto 12px', display: 'block' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p style={{ color: isDragActive ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 600, margin: '0 0 6px', fontSize: '0.9rem' }}>
                      {isDragActive ? 'Drop it here' : 'Drop your resume here'}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                      or <span style={{ color: 'var(--accent)', fontWeight: 600 }}>click to browse</span> · PDF or DOCX · max 5 MB
                    </p>
                  </>
                )}
              </div>

              {/* Optional label + color */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  maxLength={100}
                  placeholder="Label (optional)"
                  disabled={uploading}
                  style={{
                    flex: 1, background: 'var(--navy-800)', border: '1px solid var(--navy-600)',
                    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem',
                    padding: '8px 12px', fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--navy-600)'}
                />
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  {Object.entries(RESUME_COLORS).map(([key, c]) => (
                    <button
                      key={key}
                      onClick={() => setPickedColor(pickedColor === key ? null : key)}
                      title={key}
                      disabled={uploading}
                      style={{
                        width: 16, height: 16, borderRadius: '50%', background: c.dot,
                        border: pickedColor === key ? '2px solid #fff' : '2px solid transparent',
                        padding: 0, cursor: 'pointer', outline: 'none', transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.83rem', color: 'var(--danger)' }}>
                  {error}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({ resume, deleting, onConfirm, onCancel }) {
  const [skipNext, setSkipNext] = useState(false)

  function handleConfirm() {
    if (skipNext) localStorage.setItem('cv_skip_delete_confirm', 'true')
    onConfirm(resume)
  }

  // Close on Escape
  useEffect(() => {
    if (!resume) return
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resume, onCancel])

  return (
    <AnimatePresence>
      {resume && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          {/* Card — centred via flex wrapper so framer-motion transforms don't fight translate(-50%,-50%) */}
          <div
            key="modal-wrapper"
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 201,
              pointerEvents: 'none',
              padding: '16px',
            }}
          >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              pointerEvents: 'auto',
              background: 'var(--navy-900)',
              border: '1px solid var(--navy-700)',
              borderRadius: '16px',
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Delete resume?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"{resume.filename}"</span> will be permanently removed. This cannot be undone.
            </p>

            {/* Don't ask again */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '24px' }}>
              <input
                type="checkbox"
                checked={skipNext}
                onChange={e => setSkipNext(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Don't ask me again</span>
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                className="cv-btn-ghost"
                style={{ padding: '8px 18px', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleting}
                style={{
                  background: 'var(--danger, #ef4444)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                  fontFamily: 'inherit',
                  transition: 'opacity 0.15s, transform 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.opacity = '1' }}
              >
                {deleting ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Deleting…
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </motion.div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </>
      )}
    </AnimatePresence>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>
    </svg>
  )
}

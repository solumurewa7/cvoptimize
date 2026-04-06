// pages/DashboardPage.jsx
//
// The main app page. Three stages:
//   1. Upload a resume (PDF or DOCX)
//   2. Paste a job description + hit Analyse
//   3. View the results (fit score, matched/missing/semantic skills)

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import client from '../api/client'
import Navbar from '../components/Navbar'

export default function DashboardPage() {
  const [resume, setResume] = useState(null)       // saved resume object from API
  const [uploading, setUploading] = useState(false)
  const [jdText, setJdText] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [result, setResult] = useState(null)

  // --- Resume upload via drag-and-drop ---
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Only PDF and DOCX files are supported')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await client.post('/api/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResume(res.data.resume)
      setResult(null)  // clear any previous result
      toast.success(`Resume uploaded — ${res.data.resume.word_count} words extracted`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    multiple: false,
    disabled: uploading,
  })

  // --- Run analysis ---
  async function handleAnalyse() {
    if (!resume) { toast.error('Upload a resume first'); return }
    if (jdText.trim().length < 50) { toast.error('Job description is too short'); return }

    setAnalysing(true)
    try {
      const res = await client.post('/api/analyses', {
        resume_id: resume.id,
        job_description: jdText,
      })
      setResult(res.data.analysis)
    } catch (err) {
      const msg = err.response?.data?.error || 'Analysis failed'
      toast.error(msg)
    } finally {
      setAnalysing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Step 1: Upload resume ── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitle}>1. Upload your resume</h2>

          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--navy-700)'}`,
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'var(--navy-800)' : 'var(--navy-900)',
              transition: 'all 0.15s',
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Uploading…</p>
            ) : resume ? (
              <div>
                <p style={{ color: 'var(--success)', margin: '0 0 4px', fontWeight: 600 }}>
                  ✓ {resume.filename}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  {resume.word_count} words · Drop a new file to replace
                </p>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {isDragActive ? 'Drop it here' : 'Drag & drop your resume here'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  PDF or DOCX · max 5 MB
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Step 2: Job description ── */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={sectionTitle}>2. Paste the job description</h2>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={10}
            style={{
              width: '100%',
              background: 'var(--navy-900)',
              border: '1px solid var(--navy-700)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              padding: '14px',
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleAnalyse}
            disabled={analysing || !resume}
            style={{
              marginTop: '12px',
              background: analysing || !resume ? 'var(--navy-700)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: analysing || !resume ? 'not-allowed' : 'pointer',
            }}
          >
            {analysing ? 'Analysing…' : 'Analyse fit'}
          </button>
          {analysing && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
              Loading AI models on first run — this takes ~5 seconds…
            </p>
          )}
        </section>

        {/* ── Step 3: Results ── */}
        {result && <AnalysisResult result={result} />}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results display
// ---------------------------------------------------------------------------
function AnalysisResult({ result }) {
  const badgeColor = {
    Strong: 'var(--success)',
    Medium: 'var(--warning)',
    Low: 'var(--danger)',
  }[result.fit_badge] || 'var(--text-secondary)'

  return (
    <section>
      <h2 style={sectionTitle}>3. Results</h2>

      {/* Score + badge */}
      <div style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--navy-700)',
        borderRadius: '12px',
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Score circle */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: `4px solid ${badgeColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: badgeColor }}>
            {result.fit_score ?? '–'}
          </span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {result.fit_score !== null ? `${result.fit_score}% match` : 'No skills detected'}
            </span>
            {result.fit_badge && (
              <span style={{
                background: badgeColor + '22',
                color: badgeColor,
                border: `1px solid ${badgeColor}`,
                borderRadius: '20px',
                padding: '2px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}>
                {result.fit_badge}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            {result.matched_skills.length} exact matches ·{' '}
            {result.semantic_matches.length} semantic matches ·{' '}
            {result.missing_skills.length} missing skills
          </p>
        </div>
      </div>

      {/* Skill lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <SkillCard
          title="Matched skills"
          color="var(--success)"
          skills={result.matched_skills}
          emptyMsg="No exact matches found"
        />
        <SkillCard
          title="Semantic matches"
          color="var(--accent)"
          skills={result.semantic_matches.map(s => s.jd_skill)}
          emptyMsg="No semantic matches found"
        />
        <SkillCard
          title="Missing skills"
          color="var(--danger)"
          skills={result.missing_skills}
          emptyMsg="No missing skills — great fit!"
        />
      </div>
    </section>
  )
}

function SkillCard({ title, color, skills, emptyMsg }) {
  return (
    <div style={{
      background: 'var(--navy-900)',
      border: `1px solid ${color}33`,
      borderRadius: '10px',
      padding: '20px',
    }}>
      <h3 style={{ color, margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title} ({skills.length})
      </h3>
      {skills.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {skills.map((skill, i) => (
            <span key={i} style={{
              background: color + '18',
              color,
              border: `1px solid ${color}44`,
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '0.8rem',
            }}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const sectionTitle = {
  color: 'var(--text-primary)',
  fontSize: '1rem',
  fontWeight: 600,
  margin: '0 0 14px',
}

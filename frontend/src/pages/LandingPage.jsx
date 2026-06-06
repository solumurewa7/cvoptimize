// pages/LandingPage.jsx — benefit-led marketing landing page

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import ScoreRing from '../components/ScoreRing'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../context/AuthContext'

const EASE = [0.22, 1, 0.36, 1]
const ROLES = ['Software Engineer', 'Marketing Manager', 'Data Analyst', 'Product Designer', 'Nurse']

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isMobile = useIsMobile()
  const { user } = useAuth()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <SEO
        title="AI Resume Analyser"
        description="Match your resume to any job description in seconds. Get an instant AI fit score, matched skills, and gaps. Free to use — no account needed."
        path="/"
      />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: isMobile ? '32px 16px 76px' : '40px 24px 92px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient glows */}
        <div style={{
          position: 'absolute', top: '-10%', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '999px',
            padding: '5px 14px',
            marginBottom: '32px',
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
          <span style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            AI-Powered · Free to use
          </span>
        </motion.div>

        {/* Brand wordmark — the hero header */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
          style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 24px',
            color: 'var(--text-primary)',
          }}
        >
          CVO<span style={{ color: 'var(--accent)' }}>ptimize</span>
        </motion.h1>

        {/* Sub-message with rotating role */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          style={{
            fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            lineHeight: 1.6,
            margin: '0 0 38px',
          }}
        >
          Land more interviews, match your CV to any{' '}
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
            <TypeCycle words={ROLES} />
          </span>
          {' '}role in seconds.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42, ease: EASE }}
          style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {user ? (
            <Link to="/dashboard" className="cv-btn"
              style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '1rem', boxShadow: '0 4px 24px rgba(59,130,246,0.35)' }}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/analyze" className="cv-btn"
                style={{ textDecoration: 'none', padding: '14px 32px', fontSize: '1rem', boxShadow: '0 4px 24px rgba(59,130,246,0.35)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Check my fit — it's free
              </Link>
              <Link to="/register" className="cv-btn-ghost"
                style={{ textDecoration: 'none', padding: '14px 24px', fontSize: '1rem' }}>
                Create account
              </Link>
            </>
          )}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'bounceDown 1.8s ease-in-out infinite' }}>
            <style>{`@keyframes bounceDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </motion.div>
      </section>

      {/* ── Product preview ───────────────────────────────────────────────── */}
      <ProductPreview isMobile={isMobile} />

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <HowItWorks isMobile={isMobile} user={user} />

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <FeatureCards isMobile={isMobile} />

      {/* ── Trust row ─────────────────────────────────────────────────────── */}
      <TrustRow isMobile={isMobile} />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}

// ─── Rotating typewriter for the sub-message role ─────────────────────────────
function TypeCycle({ words }) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('typing') // typing | deleting

  useEffect(() => {
    const full = words[index]
    let timer
    if (phase === 'typing') {
      if (text.length < full.length) {
        timer = setTimeout(() => setText(full.slice(0, text.length + 1)), 80)
      } else {
        timer = setTimeout(() => setPhase('deleting'), 2200)
      }
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(full.slice(0, text.length - 1)), 45)
      } else {
        setIndex(i => (i + 1) % words.length)
        setPhase('typing')
      }
    }
    return () => clearTimeout(timer)
  }, [text, phase, index, words])

  return (
    <>
      {text}
      <span style={{
        display: 'inline-block', width: '2px', height: '1em',
        background: 'var(--accent)', marginLeft: '2px', verticalAlign: 'text-bottom',
        borderRadius: '1px', animation: 'blink 1s step-end infinite',
      }} />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </>
  )
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── Product preview (rotating example results) ───────────────────────────────
const BADGE = {
  Strong: { color: 'var(--success)', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
  Medium: { color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Low:    { color: 'var(--danger)',  bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)' },
}

// Everyday roles — so visitors from any field can relate, not just tech.
const EXAMPLES = [
  { title: 'Registered Nurse', score: 88, badge: 'Strong',
    blurb: 'Your clinical experience and patient-care background line up strongly with this ward role.',
    matched: ['Patient Care', 'Medication Admin', 'IV Therapy', 'EHR Charting'], missing: ['Pediatric Care', 'ACLS Cert'] },
  { title: 'Primary School Teacher', score: 76, badge: 'Strong',
    blurb: 'Your classroom experience fits well — just a couple of curriculum specifics to add.',
    matched: ['Lesson Planning', 'Classroom Management', 'Differentiation'], missing: ['SEN Experience', 'Phonics Cert'] },
  { title: 'Retail Store Manager', score: 71, badge: 'Strong',
    blurb: 'Strong people-management and sales background, with a few inventory-system gaps.',
    matched: ['Team Leadership', 'Merchandising', 'Sales Targets', 'Rota Planning'], missing: ['Loss Prevention', 'SAP Retail'] },
  { title: 'Marketing Manager', score: 64, badge: 'Medium',
    blurb: 'Good campaign experience — the role leans more on paid ads and analytics than your CV shows.',
    matched: ['Content Strategy', 'Social Media', 'Brand Campaigns'], missing: ['Google Ads', 'SEO', 'HubSpot'] },
  { title: 'Accountant', score: 82, badge: 'Strong',
    blurb: 'Your bookkeeping and reporting experience map closely to this finance role.',
    matched: ['Reconciliation', 'Financial Reporting', 'Excel', 'VAT Returns'], missing: ['SAP', 'IFRS'] },
  { title: 'Customer Service Rep', score: 79, badge: 'Strong',
    blurb: 'Your support background and communication skills fit the role well.',
    matched: ['Conflict Resolution', 'CRM Software', 'Live Chat', 'Phone Support'], missing: ['Spanish (Fluent)', 'Zendesk'] },
  { title: 'Graphic Designer', score: 68, badge: 'Medium',
    blurb: 'Solid design portfolio — the role also wants motion and web skills you haven’t listed yet.',
    matched: ['Photoshop', 'Illustrator', 'Branding', 'Typography'], missing: ['After Effects', 'Figma', 'HTML/CSS'] },
  { title: 'Software Engineer', score: 92, badge: 'Strong',
    blurb: 'Your backend and API experience aligns closely with the role’s core requirements.',
    matched: ['Python', 'REST APIs', 'PostgreSQL', 'AWS'], missing: ['Kubernetes', 'GraphQL'] },
]

function ProductPreview({ isMobile }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length))
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setIdx(i => (i + 1) % EXAMPLES.length), 4500)
    return () => clearInterval(id)
  }, [paused])

  const ex = EXAMPLES[idx]
  const b = BADGE[ex.badge] || BADGE.Strong

  return (
    <section style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '24px 16px 8px' : '40px 24px 16px' }}>
      <Reveal>
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{
            background: 'var(--navy-900)', border: '1px solid var(--navy-700)',
            borderRadius: '18px', padding: isMobile ? '20px 18px' : '28px 32px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)', position: 'relative', overflow: 'hidden',
            minHeight: isMobile ? '340px' : '260px',
          }}
        >
          <span style={{
            position: 'absolute', top: 16, right: 18,
            color: 'var(--text-secondary)', fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6,
          }}>
            Example result
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              {/* Role chip — makes it clear this works for any field */}
              <span style={{
                display: 'inline-block', background: 'var(--navy-800)', border: '1px solid var(--navy-700)',
                color: 'var(--text-secondary)', borderRadius: '999px', padding: '3px 12px',
                fontSize: '0.74rem', fontWeight: 600, marginBottom: '16px',
              }}>
                {ex.title}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '20px' : '28px', flexWrap: 'wrap' }}>
                <ScoreRing score={ex.score} badge={ex.badge} />
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
                    {ex.score}% fit
                  </p>
                  <span style={{
                    display: 'inline-block', background: b.bg, color: b.color,
                    border: `1px solid ${b.border}`, borderRadius: '999px',
                    padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '12px',
                  }}>
                    {ex.badge} match
                  </span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                    {ex.blurb}
                  </p>
                </div>
              </div>

              {/* Skill chips */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                <SkillGroup title="Matched skills" color="var(--success)" items={ex.matched} />
                <SkillGroup title="Missing skills" color="var(--warning)" items={ex.missing} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  )
}

function SkillGroup({ title, color, items }) {
  return (
    <div>
      <p style={{ color, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        {items.map(s => (
          <span key={s} style={{
            background: `${color}1a`, color, border: `1px solid ${color}40`,
            borderRadius: '999px', padding: '4px 11px', fontSize: '0.78rem', fontWeight: 500,
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
const JD_SAMPLE = 'Registered Nurse — deliver compassionate patient care, administer medications, and monitor vital signs…'

const STEPS = [
  { n: 1, type: 'link', title: 'Upload your CV', desc: 'Drop in a PDF or DOCX — no account needed to start.' },
  { n: 2, type: 'jd',   title: 'Paste the job description', desc: 'Add the role you’re targeting, responsibilities and all.' },
  { n: 3, type: 'ring', title: 'Get your fit score', desc: 'See your match score, strengths, gaps, and skills in seconds.' },
]

function HowItWorks({ isMobile, user }) {
  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '36px 16px' : '64px 24px' }}>
      <Reveal>
        <SectionLabel>How it works</SectionLabel>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <HowStep step={s} isMobile={isMobile} user={user} />
          </Reveal>
        ))}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', textAlign: 'center', margin: '16px 0 0', opacity: 0.55 }}>
        {isMobile ? 'Tap a step to preview it.' : 'Hover a step to preview it.'}
      </p>
    </section>
  )
}

function HowStep({ step, isMobile, user }) {
  const [open, setOpen] = useState(false)
  const [ring, setRing] = useState(88)

  const show = () => {
    if (step.type === 'ring') setRing(80 + Math.floor(Math.random() * 19)) // 80–98
    setOpen(true)
  }
  const hide = () => setOpen(false)

  const interactive = step.type !== 'link'
  const handlers = !interactive ? {}
    : isMobile ? { onClick: () => (open ? hide() : show()) }
    : { onMouseEnter: show, onMouseLeave: hide }

  const card = (
    <div
      className="cv-card"
      {...handlers}
      style={{
        padding: '24px 22px', height: '100%', minHeight: '184px',
        position: 'relative', overflow: 'hidden',
        cursor: (step.type === 'link' || isMobile) ? 'pointer' : 'default',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '9px',
        background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '14px',
        boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
      }}>
        {step.n}
      </div>
      <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {step.title}
        {step.type === 'link' && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        )}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
        {step.desc}
      </p>

      <AnimatePresence>
        {open && interactive && (
          <motion.div
            key="ov"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', inset: 0, background: 'var(--navy-900)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '18px', textAlign: 'center',
            }}
          >
            {step.type === 'jd' ? (
              <>
                <span style={{ color: 'var(--accent)', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Example job description
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55, margin: 0, fontStyle: 'italic' }}>
                  “{JD_SAMPLE}”
                </p>
              </>
            ) : (
              <>
                <ScoreRing score={ring} badge="Strong" />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>e.g. {ring}% fit</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (step.type === 'link') {
    return (
      <Link to={user ? '/dashboard' : '/analyze'} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {card}
      </Link>
    )
  }
  return card
}

// ─── Feature cards ────────────────────────────────────────────────────────────
function FeatureCards({ isMobile }) {
  return (
    <section style={{ maxWidth: '860px', margin: '0 auto', padding: isMobile ? '0 16px 36px' : '0 24px 64px' }}>
      <Reveal>
        <SectionLabel>What you can do</SectionLabel>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <Reveal>
          <FeatureCard
            icon={<SearchIcon />} accentColor="var(--success)" glowColor="rgba(34,197,94,0.10)"
            tag="Available now" tagColor="var(--success)" title="Job Match"
            description="Paste a job description and get an instant AI fit score — see exactly which skills you have, which are implied, and what's missing."
            cta={<Link to="/analyze" className="cv-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 22px' }}>Check my fit →</Link>}
          />
        </Reveal>
        <Reveal delay={0.08}>
          <FeatureCard
            icon={<SparklesIcon />} accentColor="var(--success)" glowColor="rgba(34,197,94,0.08)"
            tag="Available now" tagColor="var(--success)" title="Improve your CV"
            description="Get tailored AI suggestions to strengthen your resume — better phrasing, stronger impact statements, and skills to highlight per role."
            cta={<Link to="/improve" className="cv-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 22px' }}>Improve my CV →</Link>}
          />
        </Reveal>
      </div>
    </section>
  )
}

// ─── Trust row ────────────────────────────────────────────────────────────────
const TRUST = ['Free to use', 'No account needed', "Your data isn't shared"]

function TrustRow({ isMobile }) {
  return (
    <section style={{ maxWidth: '760px', margin: '0 auto', padding: isMobile ? '0 16px 36px' : '0 24px 56px' }}>
      <Reveal>
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          gap: isMobile ? '12px' : '28px',
        }}>
          {TRUST.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(34,197,94,0.12)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: '24px',
    }}>
      {children}
    </p>
  )
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '7px',
          background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7, marginBottom: '4px',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="6" rx="1.2" fill="white" opacity="0.9"/>
            <rect x="9" y="2" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
            <rect x="9" y="7" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
            <rect x="2" y="10" width="12" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
            <rect x="2" y="13" width="8" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.7 }}>
          Designed &amp; built by{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Oluwaseyi Olumurewa</span>
          {' '}— a personal project, made with purpose.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.775rem', margin: 0, opacity: 0.7 }}>
          © {new Date().getFullYear()} CVOptimize. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/terms"   style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7, textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.7, textDecoration: 'none' }}>Privacy</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, accentColor, glowColor, tag, tagColor, title, description, cta, disabled }) {
  const isMobile = useIsMobile()
  return (
    <div style={{
      background: 'var(--navy-900)',
      border: `1px solid ${disabled ? 'var(--navy-700)' : accentColor + '33'}`,
      borderRadius: '16px',
      padding: isMobile ? '22px 18px' : '32px 28px',
      display: 'flex', flexDirection: 'column', gap: '16px',
      position: 'relative', overflow: 'hidden', height: '100%',
      opacity: disabled ? 0.75 : 1,
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => {
      if (!disabled) {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 12px 40px ${accentColor}18`
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
        background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: '13px',
        background: `${accentColor}18`, border: `1px solid ${accentColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor,
      }}>
        {icon}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: `${tagColor}14`, border: `1px solid ${tagColor}33`,
        borderRadius: '999px', padding: '3px 10px', width: 'fit-content',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: tagColor }} />
        <span style={{ color: tagColor, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' }}>{tag}</span>
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
          {description}
        </p>
      </div>
      <div style={{ marginTop: 'auto' }}>{cta}</div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z"/>
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z"/>
    </svg>
  )
}

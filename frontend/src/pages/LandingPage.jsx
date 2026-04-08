// pages/LandingPage.jsx — public landing page with typewriter hero + feature cards

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import Navbar from '../components/Navbar'
import SEO from '../components/SEO'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTypewriter } from '../hooks/useTypewriter'
import { useAuth } from '../context/AuthContext'

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const suffix   = useTypewriter('ptimize', { typeMs: 100, deleteMs: 70, pauseFull: 2000, pauseEmpty: 600, loop: true })
  const isMobile = useIsMobile()
  const { user } = useAuth()

  // Used to trigger feature card animations on scroll
  const cardsRef  = useRef(null)
  const cardsInView = useInView(cardsRef, { once: true, margin: '-80px' })

  // Scroll indicator fades out once user scrolls
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        padding: isMobile ? '32px 16px 60px' : '40px 24px 80px',
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
        <div style={{
          position: 'absolute', bottom: '5%', left: '20%',
          width: '400px', height: '300px',
          background: 'radial-gradient(ellipse, rgba(29,78,216,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
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

        {/* Typewriter title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 24px',
            color: 'var(--text-primary)',
          }}
        >
          CVO
          <span style={{ color: 'var(--accent)' }}>{suffix}</span>
          {/* Blinking cursor */}
          <span style={{
            display: 'inline-block',
            width: '3px',
            height: '0.85em',
            background: 'var(--accent)',
            marginLeft: '3px',
            verticalAlign: 'middle',
            borderRadius: '1px',
            animation: 'blink 1s step-end infinite',
          }} />
          <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            lineHeight: 1.65,
            margin: '0 0 44px',
          }}
        >
          Match your resume to any job in seconds.<br />
          No account needed to get started.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {user ? (
            <Link
              to="/dashboard"
              className="cv-btn"
              style={{
                textDecoration: 'none',
                padding: '14px 32px',
                fontSize: '1rem',
                boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
              }}
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                to="/analyze"
                className="cv-btn"
                style={{
                  textDecoration: 'none',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Check my job fit — it's free
              </Link>
              <Link
                to="/register"
                className="cv-btn-ghost"
                style={{ textDecoration: 'none', padding: '14px 24px', fontSize: '1rem' }}
              >
                Create account
              </Link>
            </>
          )}
        </motion.div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: scrolled ? 0 : 0.5,
          transition: 'opacity 0.4s',
          pointerEvents: 'none',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'bounceDown 1.8s ease-in-out infinite' }}>
            <style>{`@keyframes bounceDown { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <section
        ref={cardsRef}
        style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: isMobile ? '0 16px 60px' : '0 24px 100px',
        }}
      >
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={cardsInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          What you can do
        </motion.p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {/* Analyse card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={cardsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <FeatureCard
              icon={<SearchIcon />}
              accentColor="var(--accent)"
              glowColor="rgba(59,130,246,0.12)"
              tag="Available now"
              tagColor="var(--accent)"
              title="Job Match"
              description="Paste a job description and get an instant AI fit score — see exactly which skills you have, which are implied, and what's missing."
              cta={<Link to="/analyze" className="cv-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 22px' }}>Check my fit →</Link>}
            />
          </motion.div>

          {/* Improve card (coming soon) */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={cardsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <FeatureCard
              icon={<SparklesIcon />}
              accentColor="var(--success)"
              glowColor="rgba(34,197,94,0.08)"
              tag="Available now"
              tagColor="var(--success)"
              title="Improve your CV"
              description="Get tailored AI suggestions to strengthen your resume — better phrasing, stronger impact statements, and skills to highlight per role."
              cta={<Link to="/improve" className="cv-btn" style={{ textDecoration: 'none', fontSize: '0.9rem', padding: '10px 22px' }}>Improve my CV →</Link>}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}>
          {/* Logo mark */}
          <div style={{
            width: 28, height: 28, borderRadius: '7px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.7,
            marginBottom: '4px',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="6" rx="1.2" fill="white" opacity="0.9"/>
              <rect x="9" y="2" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
              <rect x="9" y="7" width="5" height="3" rx="1.2" fill="white" opacity="0.6"/>
              <rect x="2" y="10" width="12" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
              <rect x="2" y="13" width="8" height="1.5" rx="0.75" fill="white" opacity="0.4"/>
            </svg>
          </div>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            margin: 0,
            lineHeight: 1.7,
          }}>
            Designed & built by{' '}
            <span style={{
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}>
              Oluwaseyi Olumurewa
            </span>
            {' '}— a personal project, made with purpose.
          </p>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.775rem',
            margin: 0,
            opacity: 0.5,
          }}>
            © {new Date().getFullYear()} CVOptimize. All rights reserved.
          </p>

          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/terms"   style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.55, textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', opacity: 0.55, textDecoration: 'none' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
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
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
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
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '200px', height: '200px',
        background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '13px',
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor,
      }}>
        {icon}
      </div>

      {/* Tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: `${tagColor}14`,
        border: `1px solid ${tagColor}33`,
        borderRadius: '999px',
        padding: '3px 10px',
        width: 'fit-content',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: tagColor }} />
        <span style={{ color: tagColor, fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em' }}>
          {tag}
        </span>
      </div>

      <div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, margin: 0 }}>
          {description}
        </p>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {cta}
      </div>
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

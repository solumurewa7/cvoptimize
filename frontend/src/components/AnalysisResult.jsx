// components/AnalysisResult.jsx
//
// Shared component for displaying a full Job Match analysis result.
// Used by AnalyzePage (inline after running) and AnalysisDetailPage (from history).

import { motion } from 'framer-motion'
import ScoreRing from './ScoreRing'

const EASE = [0.22, 1, 0.36, 1]

function getRecommendation(score) {
  if (score >= 75) return { label: 'Apply', color: 'var(--success)', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.30)', icon: '✓' }
  if (score >= 50) return { label: 'Apply — address gaps first', color: 'var(--accent)',  bg: 'rgba(99,179,237,0.10)', border: 'rgba(99,179,237,0.30)', icon: '→' }
  if (score >= 30) return { label: 'Improve before applying',    color: 'var(--warning)', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: '△' }
  return               { label: 'May not meet requirements',     color: 'var(--danger)',  bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  icon: '✕' }
}

export default function AnalysisResult({ result }) {
  const badgeColor = { Strong: 'var(--success)', Medium: 'var(--warning)', Low: 'var(--danger)' }[result.fit_badge] || 'var(--text-secondary)'
  const badgeBg    = { Strong: 'rgba(34,197,94,0.1)', Medium: 'rgba(245,158,11,0.1)', Low: 'rgba(239,68,68,0.1)' }[result.fit_badge] || 'var(--navy-800)'

  const strengths     = result.strengths     || []
  const gaps          = result.gaps          || []
  const matchedSkills = result.matched_skills || []
  const missingSkills = result.missing_skills || []
  const total         = strengths.length + gaps.length
  const totalSkills   = matchedSkills.length + missingSkills.length
  const skillPct      = totalSkills > 0 ? Math.round((matchedSkills.length / totalSkills) * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Score row ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '28px',
        background: 'var(--navy-800)', border: '1px solid var(--navy-700)',
        borderRadius: '12px', padding: '24px 28px',
      }}>
        <ScoreRing score={result.fit_score} badge={result.fit_badge} />

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {result.fit_score !== null ? `${result.fit_score}% fit` : 'Unable to score'}
            </span>
            {result.fit_badge && (
              <span style={{
                background: badgeBg, color: badgeColor,
                border: `1px solid ${badgeColor}44`,
                borderRadius: '999px', padding: '3px 12px',
                fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.02em',
              }}>
                {result.fit_badge} match
              </span>
            )}
          </div>

          {/* AI recommendation */}
          {result.fit_score !== null && (() => {
            const rec = getRecommendation(result.fit_score)
            return (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: rec.bg, border: `1px solid ${rec.border}`,
                borderRadius: '8px', padding: '6px 14px', marginBottom: '12px',
              }}>
                <span style={{ fontSize: '0.75rem', color: rec.color, opacity: 0.8 }}>{rec.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: rec.color, letterSpacing: '0.01em' }}>
                  AI Recommendation:
                </span>
                <span style={{ fontSize: '0.8rem', color: rec.color }}>{rec.label}</span>
              </div>
            )
          })()}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Stat value={strengths.length}     label="strengths"      color="var(--success)" />
            <Stat value={gaps.length}          label="gaps"           color="var(--danger)"  />
            {matchedSkills.length > 0 && (
              <Stat value={matchedSkills.length} label="matched skills" color="var(--accent)" />
            )}
          </div>

          {/* Skills match bar */}
          {skillPct !== null && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Skills Match
                </span>
                <span style={{ color: skillPct >= 70 ? 'var(--success)' : skillPct >= 40 ? 'var(--warning)' : 'var(--danger)', fontSize: '0.82rem', fontWeight: 700 }}>
                  {matchedSkills.length} / {totalSkills} — {skillPct}%
                </span>
              </div>
              <div style={{ height: '7px', borderRadius: '4px', background: 'var(--navy-700)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skillPct}%` }}
                  transition={{ duration: 1, ease: EASE, delay: 0.15 }}
                  style={{
                    height: '100%', borderRadius: '4px',
                    background: skillPct >= 70 ? 'var(--success)' : skillPct >= 40 ? 'var(--warning)' : 'var(--danger)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '5px' }}>
                <LegendDot color="var(--success)" label={`Matched (${matchedSkills.length})`} />
                <LegendDot color="var(--navy-600)" label={`Missing (${missingSkills.length})`} />
              </div>
            </div>
          )}

          {/* Strength/gap split bar */}
          {total > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ height: '6px', borderRadius: '3px', background: 'var(--navy-700)', overflow: 'hidden', display: 'flex' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(strengths.length / total) * 100}%` }}
                  transition={{ duration: 1, ease: EASE, delay: 0.1 }}
                  style={{ background: 'var(--success)', height: '100%' }}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(gaps.length / total) * 100}%` }}
                  transition={{ duration: 1, ease: EASE, delay: 0.2 }}
                  style={{ background: 'var(--danger)', height: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <LegendDot color="var(--success)" label="Strengths" />
                <LegendDot color="var(--danger)"  label="Gaps"      />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bullet panels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        <BulletPanel
          title="What's working"
          color="var(--success)"
          icon={<CheckIcon />}
          bullets={strengths}
          emptyMsg="No particular strengths identified — try a different role."
          delay={0.05}
        />
        <BulletPanel
          title="Gaps & weaknesses"
          color="var(--danger)"
          icon={<XIcon />}
          bullets={gaps}
          emptyMsg="No significant gaps — great fit!"
          delay={0.1}
        />
      </div>

      {/* ── Skill chips ── */}
      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {matchedSkills.length > 0 && (
            <SkillCard title="Matched skills" color="var(--success)" icon={<CheckIcon />} skills={matchedSkills} delay={0.15} />
          )}
          {missingSkills.length > 0 && (
            <SkillCard title="Missing skills" color="var(--danger)" icon={<XIcon />} skills={missingSkills} delay={0.2} />
          )}
        </div>
      )}

      {/* ── JD snippet ── */}
      {result.jd_snippet && (
        <div style={{
          background: 'var(--navy-800)', border: '1px solid var(--navy-700)',
          borderRadius: '10px', padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{result.jd_snippet}{result.jd_snippet.length >= 150 ? '…' : ''}"
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function BulletPanel({ title, color, icon, bullets, emptyMsg, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: EASE }}
      style={{
        background: 'var(--navy-800)', borderRadius: '12px',
        border: `1px solid ${color}28`, borderLeft: `3px solid ${color}`,
        padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 26, height: 26, borderRadius: '7px', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ color, fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ marginLeft: 'auto', background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: '999px', padding: '1px 9px', fontSize: '0.75rem', fontWeight: 600 }}>
          {bullets.length}
        </span>
      </div>
      {bullets.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: 0, fontStyle: 'italic' }}>{emptyMsg}</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bullets.map((bullet, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: delay + i * 0.04 }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', listStyle: 'none' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: '7px' }} />
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.65 }}>{bullet}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

function Stat({ value, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
      <span style={{ fontSize: '1.15rem', fontWeight: 700, color }}>{value}</span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{label}</span>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{label}</span>
    </div>
  )
}

function SkillCard({ title, color, icon, skills, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay, ease: EASE }}
      style={{ background: 'var(--navy-800)', border: `1px solid ${color}28`, borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ color, width: 28, height: 28, background: `${color}14`, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
        <span style={{ color, fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <span style={{ marginLeft: 'auto', background: `${color}18`, color, border: `1px solid ${color}33`, borderRadius: '999px', padding: '1px 9px', fontSize: '0.75rem', fontWeight: 600 }}>{skills.length}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
        {skills.map((skill, i) => (
          <motion.span key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: delay + i * 0.025 }}
            style={{ background: `${color}14`, color, border: `1px solid ${color}33`, borderRadius: '6px', padding: '3px 10px', fontSize: '0.78rem', fontWeight: 500 }}>
            {skill}
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}

function CheckIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function XIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

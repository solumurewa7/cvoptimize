// components/ScoreRing.jsx
//
// Animated circular score indicator.
// The ring stroke draws itself in on mount, and the number counts up.
// Color tracks the badge level: green / amber / red / grey.

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const SIZE   = 120   // svg viewBox px
const STROKE = 8
const R      = (SIZE - STROKE) / 2
const CIRC   = 2 * Math.PI * R

// Map badge → color variable
const BADGE_COLOR = {
  Strong: 'var(--success)',
  Medium: 'var(--warning)',
  Low:    'var(--danger)',
}

export default function ScoreRing({ score, badge }) {
  const color = BADGE_COLOR[badge] || 'var(--text-secondary)'
  const pct   = score != null ? score / 100 : 0

  // Spring-animated stroke dash offset: start fully hidden, animate to actual value
  const raw    = useMotionValue(CIRC)            // starts at CIRC (no stroke shown)
  const spring = useSpring(raw, { stiffness: 60, damping: 18 })
  const target = CIRC - pct * CIRC              // fully drawn = 0; fully hidden = CIRC

  // Animated counter for the number in the centre
  const countVal = useMotionValue(0)
  const countSpring = useSpring(countVal, { stiffness: 60, damping: 18 })
  const displayCount = useTransform(countSpring, v => Math.round(v))

  useEffect(() => {
    raw.set(target)
    countVal.set(score ?? 0)
  }, [score, target, raw, countVal])

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--navy-700)"
          strokeWidth={STROKE}
        />
        {/* Animated arc */}
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: spring }}
        />
      </svg>

      {/* Centre number */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}>
        {score != null ? (
          <>
            <motion.span style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {displayCount}
            </motion.span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              / 100
            </span>
          </>
        ) : (
          <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 700 }}>–</span>
        )}
      </div>
    </div>
  )
}

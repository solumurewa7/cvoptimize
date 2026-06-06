// components/AnalysisProgress.jsx
//
// Loading state for the AI analysis / improve calls (~10-60s each).
//
// A real progress bar is impossible — a single Gemini call emits no progress
// events — so this is a *simulated* bar that eases toward ~92% and never visibly
// completes on its own. When results arrive the parent unmounts this block (the
// fade-out + results animating in reads as completion). Rotating status messages
// keep the wait feeling alive and settle on the last message.
//
// Usage: render only while a request is in flight, e.g.
//   <AnimatePresence>{analysing && <AnalysisProgress messages={MSGS} />}</AnimatePresence>

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]
const CAP = 92            // bar asymptotes toward this %, never reaching 100 on its own
const K = 0.045           // easing factor per tick — higher = faster early fill
const TICK_MS = 200       // bar update interval
const MESSAGE_MS = 3500   // how long each message shows before advancing

export default function AnalysisProgress({ messages = [], style }) {
  const [pct, setPct] = useState(6)   // start with a small visible sliver
  const [msgIndex, setMsgIndex] = useState(0)
  const pctRef = useRef(6)

  // Simulated, easing progress — fast at first, slows as it nears the cap.
  useEffect(() => {
    const id = setInterval(() => {
      pctRef.current += (CAP - pctRef.current) * K
      setPct(Math.min(pctRef.current, CAP))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // Advance through the messages, then hold on the final one.
  useEffect(() => {
    if (messages.length <= 1) return
    const id = setInterval(() => {
      setMsgIndex(i => (i < messages.length - 1 ? i + 1 : i))
    }, MESSAGE_MS)
    return () => clearInterval(id)
  }, [messages.length])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      style={{ overflow: 'hidden', width: '100%', ...style }}
    >
      <div style={{ paddingTop: '14px' }}>
        {/* Track + fill */}
        <div
          role="progressbar"
          aria-label="Analysing"
          style={{
            width: '100%',
            height: '6px',
            background: 'var(--navy-800)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent) 0%, #1d4ed8 100%)',
              borderRadius: '999px',
              transition: `width ${TICK_MS}ms linear`,
            }}
          />
        </div>

        {/* Rotating status message */}
        <div style={{ marginTop: '10px', minHeight: '1.2em' }}>
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}
          >
            {messages[msgIndex]}
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}

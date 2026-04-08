// hooks/useTypewriter.js — shared typewriter state machine
import { useState, useEffect } from 'react'

/**
 * @param {string} text - The full text to type
 * @param {object} options
 * @param {number} options.typeMs    - ms per character typed
 * @param {number} options.deleteMs  - ms per character deleted
 * @param {number} options.pauseFull - ms to pause at full text before deleting
 * @param {number} options.pauseEmpty - ms to pause at empty before retyping
 * @param {boolean} options.loop     - if false, stops after typing once (no delete)
 */
export function useTypewriter(text, {
  typeMs = 80,
  deleteMs = 60,
  pauseFull = 2000,
  pauseEmpty = 500,
  loop = true,
} = {}) {
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState('typing') // 'typing' | 'pausing' | 'deleting' | 'waiting'

  useEffect(() => {
    // Reset when text changes (e.g. user name loads)
    setDisplayed('')
    setPhase('typing')
  }, [text])

  useEffect(() => {
    let timer

    if (phase === 'typing') {
      if (displayed.length < text.length) {
        timer = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), typeMs)
      } else {
        if (loop) {
          setPhase('pausing')
        }
        // if loop=false, stay in 'typing' phase with full text displayed — done
      }
    } else if (phase === 'pausing') {
      timer = setTimeout(() => setPhase('deleting'), pauseFull)
    } else if (phase === 'deleting') {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), deleteMs)
      } else {
        setPhase('waiting')
      }
    } else if (phase === 'waiting') {
      timer = setTimeout(() => setPhase('typing'), pauseEmpty)
    }

    return () => clearTimeout(timer)
  }, [phase, displayed, text, typeMs, deleteMs, pauseFull, pauseEmpty, loop])

  return displayed
}

// Shared resume color palette — muted tints safe on dark backgrounds.
// Keys are stored in the DB `color` column; values drive card styling.
export const RESUME_COLORS = {
  amber:   { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  dot: '#fbbf24' },
  rose:    { bg: 'rgba(244,63,94,0.10)',   border: 'rgba(244,63,94,0.30)',   dot: '#f43f5e' },
  emerald: { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)',  dot: '#34d399' },
  violet:  { bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)', dot: '#a78bfa' },
  sky:     { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)',  dot: '#38bdf8' },
}

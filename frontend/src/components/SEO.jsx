// components/SEO.jsx — reusable per-page meta tags
import { Helmet } from 'react-helmet-async'

const BASE_URL = 'https://cvooptimize.com'
const OG_IMAGE = `${BASE_URL}/og-image.svg`

const DEFAULT_DESC = 'Match your resume to any job description in seconds. Get an instant AI fit score, matched skills, and gaps. Free to use.'

export default function SEO({ title, description, noIndex = false, path = '' }) {
  const fullTitle = title ? `${title} — CVOptimize` : 'CVOptimize — AI Resume Analyser'
  const desc = description || DEFAULT_DESC
  const url = `${BASE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url"         content={url} />
      <meta property="og:image"       content={OG_IMAGE} />
      <meta property="og:type"        content="website" />
      <meta property="og:site_name"   content="CVOptimize" />

      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={OG_IMAGE} />
    </Helmet>
  )
}

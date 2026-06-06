# CVOptimize — Claude Code Reference

## Project Overview

Full-stack AI resume analyser. Flask backend + React (Vite) frontend.
Live at: **https://cvoptimize.site**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Framer Motion, Axios, react-helmet-async |
| Backend | Flask, Flask-JWT-Extended, Flask-Migrate, Flask-Limiter, Flask-CORS |
| Database | PostgreSQL (Supabase) via SQLAlchemy |
| AI | Google Gemini Flash (`google-genai`) |
| Email | Resend (authenticated domain: cvoptimize.site) |
| Hosting | Render (backend Web Service + frontend Static Site) |
| Domain | Namecheap — cvoptimize.site |

---

## Project Structure

```
cvooptimize/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory, CORS config
│   │   ├── config.py            # Dev/Prod/Test config classes
│   │   ├── extensions.py        # db, migrate, jwt, limiter
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── resume.py        # custom_name, color columns
│   │   │   └── analysis.py      # job_title, company columns
│   │   ├── routes/
│   │   │   ├── auth.py          # /api/auth/*
│   │   │   ├── resume.py        # /api/resumes/* (upload, PATCH, delete)
│   │   │   ├── analysis.py      # /api/analyses/* (create, list, get, jd-history, guest)
│   │   │   └── improve.py       # /api/improve/*
│   │   └── services/
│   │       ├── analyzer.py      # Gemini prompt + run_analysis()
│   │       ├── improver.py      # Gemini CV improvement
│   │       └── resume_parser.py # PDF/DOCX text extraction
│   ├── migrations/              # Alembic migrations
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/client.js        # Axios instance (baseURL, CSRF interceptor)
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── SEO.jsx          # BASE_URL = https://cvoptimize.site
│       │   ├── ScoreRing.jsx
│       │   └── AnalysisResult.jsx  # Skills bar + AI recommendation badge
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── DashboardPage.jsx    # Resume cards with color/label editing
│       │   ├── AnalyzePage.jsx      # Job Match + JD history re-use
│       │   ├── ImproverPage.jsx     # CV Improve
│       │   ├── HistoryPage.jsx      # Analysis history list
│       │   ├── AnalysisDetailPage.jsx
│       │   └── AccountPage.jsx
│       └── utils/
│           └── resumeColors.js  # RESUME_COLORS shared constant (amber/rose/emerald/violet/sky)
└── CLAUDE.md                    # this file
```

---

## Features Completed

- **Auth** — register, login, logout, JWT httpOnly cookies, email verification, forgot/reset password
- **Job Match** — resume + JD → Gemini AI fit score, strengths, gaps, matched/missing skills
- **Improve CV** — resume → Gemini AI rewrite suggestions
- **Resume management** — upload PDF/DOCX, preview, delete, custom label, color coding
- **Analysis history** — saved per user, full detail view, "Role — Company" titles
- **Skills match bar** — animated progress bar (matched vs missing)
- **AI recommendation badge** — Apply / Apply address gaps / Improve before applying / May not meet requirements
- **JD history re-use** — re-use past job descriptions on /analyze
- **Guest mode** — Job Match + Improve without login (not saved)
- **Rate limiting** — 20/day auth users, 5/day guests
- **Email** — SendGrid verification + password reset
- **SEO** — meta tags, og-image, robots.txt, sitemap.xml
- **Custom domain** — cvoptimize.site + www.cvoptimize.site (SSL via Render)

---

## Deployment

### Render Services

| Service | URL |
|---------|-----|
| Backend | `https://cvooptimize.onrender.com` |
| Frontend | `https://cvooptimize-frontend.onrender.com` |
| Live site | `https://cvoptimize.site` |

Auto-deploys on push to `main`.

### Environment Variables

**Backend:**
- `FLASK_ENV` = `production`
- `DATABASE_URL` = Supabase PostgreSQL connection string
- `JWT_SECRET_KEY`, `SECRET_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM` (= `no-reply@cvoptimize.site`)
- `FRONTEND_URL` = `https://cvoptimize.site`

**Frontend:**
- `VITE_API_URL` = `https://cvooptimize.onrender.com`
- `VITE_PUBLIC_URL` = `https://cvoptimize.site`

### DNS (Namecheap)

| Type | Host | Value |
|------|------|-------|
| A Record | `@` | `216.24.57.1` |
| CNAME | `www` | `cvooptimize-frontend.onrender.com` |
| CNAME | `api` | `cvooptimize.onrender.com` |

---

## Key Architecture Notes

- **CSRF disabled in production** — `JWT_COOKIE_CSRF_PROTECT = False` in ProductionConfig. Frontend and backend on different domains; CORS origin restriction provides equivalent protection.
- **SameSite=None** — required because frontend and backend are cross-origin in production.
- **CORS** — hardcoded in `backend/app/__init__.py`: Render URLs + `https://cvoptimize.site` + `https://www.cvoptimize.site` + `FRONTEND_URL` env var.
- **Resume files** — stored as LargeBinary in PostgreSQL (no object storage). Streamed via `send_file` inline.
- **Gemini** — `from google import genai`, model `gemini-2.5-flash`, structured JSON prompt. All calls go through `backend/app/services/ai_client.py` (`generate()`), which retries transient failures and raises typed `AIRateLimitError` / `AIServiceError`. Routes map these to clean 429/503 messages — raw exceptions are never returned to the client.
- **Email** — `backend/app/services/email.py` sends via Resend from `EMAIL_FROM` (authenticated domain `cvoptimize.site`). Email send failures are logged (not silently swallowed) but never block auth flows.

---

## GitHub

Repo: `https://github.com/solumurewa7/cvooptimize`
Branch: `main`

---

## Pending / Future Work

- **Resend domain auth (DNS)** — add Resend's DKIM/SPF/DMARC records for cvoptimize.site in Namecheap and verify in Resend before relying on email.
- **Render Starter plan** — upgrade backend to always-on to remove cold-start login failures.
- **Enable paid Gemini billing** — pay-as-you-go on the GEMINI_API_KEY project to remove free-tier 429s.
- ~~Slim requirements.txt~~ — already slim (no torch/spacy/sentence-transformers present).

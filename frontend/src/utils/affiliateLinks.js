// utils/affiliateLinks.js — single source of truth for the "Recommended next steps" links.
//
// HOW TO EARN FROM THESE:
//   1. Sign up to the relevant affiliate programs, e.g.:
//        - CV review:  TopResume, Resume Writing services, Fiverr Pro
//        - Templates:  Resume.io, Zety, Kickresume, Canva
//        - Courses:    Coursera (via Impact), Udemy Affiliate, Skillshare, LinkedIn Learning
//        - Job search: ZipRecruiter, FlexJobs
//   2. Once approved, replace each `url` below with YOUR affiliate tracking URL.
//   3. That's it — the component picks these up automatically.
//
// Until you add tracking URLs, the default links still work (they just won't earn a commission).
// Keep this list short and relevant so the section stays tasteful, not spammy.

export const AFFILIATE_LINKS = [
  {
    id: 'review',
    icon: 'badge',
    title: 'Get your CV reviewed by a pro',
    description: 'Have an expert sharpen your resume before you apply.',
    cta: 'Find a reviewer',
    url: 'https://www.topresume.com/', // TODO: replace with your affiliate tracking URL
  },
  {
    id: 'templates',
    icon: 'template',
    title: 'Polished resume templates',
    description: 'Clean, ATS-friendly templates you can fill in minutes.',
    cta: 'Browse templates',
    url: 'https://resume.io/', // TODO: replace with your affiliate tracking URL
  },
  {
    id: 'courses',
    icon: 'course',
    title: 'Close your skill gaps',
    description: 'Top-rated courses to pick up the skills roles ask for.',
    cta: 'Explore courses',
    url: 'https://www.coursera.org/', // TODO: replace with your affiliate tracking URL
  },
]

# services/analyzer.py
#
# AI analysis engine — powered by Google Gemini Flash.
#
# Pipeline:
#   1. Send the full resume text + full job description to Gemini Flash
#   2. Gemini reads both documents holistically and returns structured JSON:
#       - fit_score  (0-100)
#       - strengths  (up to 10 specific bullet strings referencing the resume)
#       - gaps       (up to 10 specific bullet strings referencing the JD)
#       - matched_skills  (concise skill tag strings present in the resume)
#       - missing_skills  (concise skill tag strings absent from the resume)
#   3. We derive fit_badge from the score and return the full result dict.

import json
import re

from .ai_client import generate, AIServiceError


# ---------------------------------------------------------------------------
# Badge helper
# ---------------------------------------------------------------------------

def _badge(score: int) -> str:
    if score >= 70:
        return "Strong"
    if score >= 40:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Gemini prompt
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """
You are an expert recruiter who evaluates candidates fairly across every industry — healthcare, education, trades, retail, finance, creative, tech and more. Your job is to assess how well a candidate's resume matches a specific job description.

Read both documents carefully and completely — do not skim.

=== JOB DESCRIPTION ===
{jd_text}

=== RESUME ===
{resume_text}

=== HOW TO EVALUATE ===
Judge the match objectively and by the norms of the role's own field (a nursing role against healthcare experience, a teaching role against education experience, and so on — never impose conventions from an unrelated field). Consider:
- Explicit skills and requirements stated in the JD
- Implied skills and experience the role needs, even if not stated as hard requirements
- Relevant work experience, projects, and education
- Soft skills (teamwork, communication, leadership) where the JD calls for them
- Whether the candidate's experience level fits the role
- DO NOT penalise for skills that are clearly implied or demonstrated indirectly in the resume.

CRITICAL — DO NOT JUDGE TIME OR DATES:
- You do NOT know today's date. Never reason about what is "current", "future", "expired" or "recent".
- Never treat dates, tenses, "expected"/in-progress qualifications, employment gaps, or chronology as a gap, problem or inconsistency. Take every date and qualification exactly as written, at face value.

GAPS — keep them real and constructive:
- A "gap" is ONLY a skill or area of experience the JD genuinely requires that the resume does not evidence. Frame it constructively, as something the candidate could add or highlight.
- Never list dates, formatting, chronology, or assumptions as gaps.

Be honest about the fit score — it is a real signal for the candidate, so do not inflate it.

Scoring guide:
- 90-100: Near-perfect fit. Candidate has almost everything required.
- 70-89:  Strong fit. Candidate has most key requirements with minor gaps.
- 40-69:  Partial fit. Candidate has some relevant experience but notable gaps.
- 0-39:   Limited fit. Significant missing requirements.

Return ONLY a valid JSON object — no markdown, no explanation, no extra text. The JSON must have exactly these keys:

{{
  "fit_score": <integer 0-100>,
  "job_title": "<Short job title extracted or inferred from the JD, e.g. 'Senior Software Engineer', 'Registered Nurse', 'Marketing Manager'. Even if not stated explicitly, infer a reasonable title. Max 60 characters.>",
  "company": "<Company name extracted from the JD, e.g. 'Google', 'Accenture'. Return null (not a string) if no company is mentioned or identifiable.>",
  "strengths": [
    "<Specific bullet. Reference actual resume content AND the JD requirement it satisfies. Max 2 sentences.>",
    "...(up to 10 total)"
  ],
  "gaps": [
    "<A skill or experience the JD genuinely needs that the resume does not show, framed constructively. Max 2 sentences. Never about dates, time, or formatting.>",
    "...(up to 10 total)"
  ],
  "matched_skills": ["<concise skill name>", "..."],
  "missing_skills": ["<concise skill name>", "..."]
}}

Rules:
- strengths and gaps must each be plain strings — not objects.
- matched_skills and missing_skills must be short (1-4 words each), suitable for UI chip labels.
- Do not repeat the same point in both strengths and gaps.
- Do not comment on dates, time, or chronology anywhere in the output.
- Be honest and precise. A 90+ score should be rare and truly deserved.
- Limit strengths to a maximum of 10 items. Limit gaps to a maximum of 10 items.
- Return ONLY the JSON object. No other text.
"""


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_analysis(resume_text: str, jd_text: str) -> dict:
    """
    Send the resume + JD to Gemini Flash and return a structured analysis dict.

    Returns:
        {
            "fit_score": int,
            "fit_badge": str,
            "strengths": list[str],
            "gaps": list[str],
            "matched_skills": list[str],
            "missing_skills": list[str],
            "jd_snippet": str,
            # Legacy keys (empty) kept so existing route code doesn't break
            "extracted_jd_skills": [],
            "semantic_matches": [],
        }
    """
    prompt = _PROMPT_TEMPLATE.format(
        jd_text=jd_text.strip(),
        resume_text=resume_text.strip(),
    )

    # Calls Gemini with retry/backoff; raises AIRateLimitError / AIServiceError.
    raw = generate(prompt)

    # Strip any accidental markdown code fences Gemini sometimes adds
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        # Don't leak the raw model output to the caller — log-friendly message only.
        raise AIServiceError("Gemini returned malformed output") from e

    # Validate and coerce fields
    score = int(data.get("fit_score", 0))
    score = max(0, min(100, score))  # clamp to [0, 100]

    job_title = str(data.get("job_title", "") or "").strip()[:60] or None

    raw_company = data.get("company")
    company = str(raw_company).strip()[:80] or None if raw_company else None

    strengths = [str(s) for s in data.get("strengths", [])[:10]]
    gaps      = [str(g) for g in data.get("gaps", [])[:10]]
    matched   = [str(s) for s in data.get("matched_skills", [])]
    missing   = [str(s) for s in data.get("missing_skills", [])]

    return {
        "fit_score":           score,
        "fit_badge":           _badge(score),
        "job_title":           job_title,
        "company":             company,
        "strengths":           strengths,
        "gaps":                gaps,
        "matched_skills":      matched,
        "missing_skills":      missing,
        "jd_snippet":          jd_text[:150].strip(),
        # Legacy keys — kept empty so route code that references them still works
        "extracted_jd_skills": [],
        "semantic_matches":    [],
    }

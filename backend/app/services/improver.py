# services/improver.py
#
# AI resume improvement engine — powered by Google Gemini Flash.
#
# Pipeline:
#   1. Send the full resume text to Gemini Flash
#   2. Gemini reads the resume holistically and returns structured JSON:
#       - overall_score  (0-100)
#       - overall_badge  ("Excellent" / "Good" / "Fair" / "Poor")
#       - summary        (1-2 sentence holistic assessment)
#       - strengths      (up to 6 things already done well)
#       - improvements   (up to 10 actionable suggestions with example rewrites)
#       - missing_elements (things absent from the resume)
#       - ats_tips       (keyword/formatting tips for ATS scanners)
#   3. We validate, coerce, and return the result dict.

import os
import json
import re

from google import genai

# ---------------------------------------------------------------------------
# Lazy client loading (shared pattern with analyzer.py)
# ---------------------------------------------------------------------------
_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY is not set. Add it to backend/.env and restart Flask."
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Badge helper
# ---------------------------------------------------------------------------

def _badge(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 65:
        return "Good"
    if score >= 40:
        return "Fair"
    return "Poor"


# ---------------------------------------------------------------------------
# Gemini prompt
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """
You are an expert CV coach, recruiter, and ATS specialist with 15+ years of experience reviewing thousands of resumes across all industries.

Read the following resume carefully and completely.

=== RESUME ===
{resume_text}

=== TASK ===
Analyse this resume on its own merits — NOT against any specific job description. Evaluate it holistically for:
- Quality and impact of language (action verbs, specificity, quantified achievements)
- Structure and completeness (sections present, logical order, appropriate length)
- ATS (Applicant Tracking System) friendliness (keywords, formatting, parsability)
- Professional tone and clarity
- Presence of key sections (summary/objective, experience, education, skills, etc.)

Scoring guide:
- 85-100: Excellent — near-publication ready, minor polishing only
- 65-84:  Good — solid foundation with clear, fixable gaps
- 40-64:  Fair — needs meaningful rework in several areas
- 0-39:   Poor — fundamental issues that significantly hurt candidacy

Return ONLY a valid JSON object — no markdown, no explanation, no extra text. The JSON must have exactly these keys:

{{
  "overall_score": <integer 0-100>,
  "summary": "<1-2 sentence holistic assessment of the resume's current state and biggest opportunity>",
  "strengths": [
    "<Specific strength. Reference actual resume content. Max 1 sentence.>",
    "...(up to 6 total)"
  ],
  "improvements": [
    {{
      "area": "<Short section or topic, e.g. 'Work Experience', 'Skills Section', 'Professional Summary'>",
      "issue": "<Concise description of the problem — max 1 sentence>",
      "example_rewrite": "<Show a before → after rewrite using actual or representative text from the resume>"
    }},
    "...(up to 10 total)"
  ],
  "missing_elements": [
    "<Short label for something absent, e.g. 'Professional Summary', 'Quantified Achievements', 'LinkedIn URL'>",
    "...(up to 8 total)"
  ],
  "ats_tips": [
    "<Specific, actionable ATS tip — max 1 sentence>",
    "...(up to 6 total)"
  ]
}}

Rules:
- improvements must be objects with exactly the keys: area, issue, example_rewrite.
- strengths, missing_elements, and ats_tips must be plain strings — not objects.
- Be specific: reference actual content from the resume, not generic advice.
- Be honest: an 85+ score should be rare and truly deserved.
- Return ONLY the JSON object. No other text.
"""


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_improvement(resume_text: str) -> dict:
    """
    Send the resume to Gemini Flash and return a structured improvement dict.

    Returns:
        {
            "overall_score": int,
            "overall_badge": str,
            "summary": str,
            "strengths": list[str],
            "improvements": list[dict],   # [{area, issue, example_rewrite}]
            "missing_elements": list[str],
            "ats_tips": list[str],
        }
    """
    client = _get_client()

    prompt = _PROMPT_TEMPLATE.format(resume_text=resume_text.strip())

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
    except Exception as e:
        raise RuntimeError(f"Gemini API call failed: {e}") from e

    # Strip any accidental markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            f"Gemini returned non-JSON output. Raw response:\n{raw[:500]}"
        ) from e

    # Validate and coerce fields
    score = int(data.get("overall_score", 0))
    score = max(0, min(100, score))

    summary = str(data.get("summary", "")).strip()

    strengths = [str(s) for s in data.get("strengths", [])[:6]]

    raw_improvements = data.get("improvements", [])[:10]
    improvements = []
    for item in raw_improvements:
        if isinstance(item, dict):
            improvements.append({
                "area":            str(item.get("area", "")),
                "issue":           str(item.get("issue", "")),
                "example_rewrite": str(item.get("example_rewrite", "")),
            })

    missing_elements = [str(m) for m in data.get("missing_elements", [])[:8]]
    ats_tips         = [str(t) for t in data.get("ats_tips", [])[:6]]

    return {
        "overall_score":    score,
        "overall_badge":    _badge(score),
        "summary":          summary,
        "strengths":        strengths,
        "improvements":     improvements,
        "missing_elements": missing_elements,
        "ats_tips":         ats_tips,
    }

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

import json
import re

from .ai_client import generate, AIServiceError


# ---------------------------------------------------------------------------
# Badge helper
# ---------------------------------------------------------------------------

def _badge(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 50:
        return "Developing"
    return "Needs work"


# ---------------------------------------------------------------------------
# Gemini prompt
# ---------------------------------------------------------------------------

_PROMPT_TEMPLATE = """
You are an expert CV coach who has reviewed thousands of resumes across every industry — healthcare, education, trades, retail, finance, creative, tech and more.

Read the following resume carefully and completely.

=== RESUME ===
{resume_text}

=== HOW TO EVALUATE ===
First, infer the candidate's field/industry and seniority from the content. Judge the resume by the STANDARDS OF ITS OWN FIELD — never impose conventions from an unrelated field (for example, never expect software keywords or GitHub links on a nurse's, teacher's, or retail manager's resume).

Focus on CONTENT and WORDING:
- Clarity, specificity and impact of each line (strong action verbs, concrete outcomes)
- Quantified achievements ONLY where they naturally fit this field — do not force numbers onto roles that aren't measured that way
- Relevance and signal — does every line earn its place?
- Professional tone, grammar and consistency
- Whether the sections that are standard for THIS field are present and clearly organised

CRITICAL — DO NOT JUDGE TIME OR DATES:
- You do NOT know today's date. Never reason about what is "current", "future", "expired" or "recent".
- Never flag dates, tenses, "expected"/in-progress qualifications, employment gaps, or chronology as problems or inconsistencies. Take every date and qualification exactly as written, at face value.

SUGGESTIONS — REAL CHANGES ONLY:
- Only raise an improvement when it is a GENUINE, meaningful upgrade. Never invent problems to fill a quota. Returning just 2-3 improvements (or fewer) is good when that is all that honestly applies.
- Every improvement MUST quote the candidate's OWN words and show a concrete, stronger rewrite of those exact words. Never give generic or templated advice (e.g. "use an achievement-focused summary") unless you also rewrite their actual line to demonstrate it.
- If a section is already strong, do NOT rewrite it — acknowledge it in strengths instead.

TONE:
- Be honest but genuinely encouraging and constructive. Lead with what works. Frame every suggestion as a way to get even better, never as a failing. Never be harsh or discouraging.

SCORING (encouraging but honest):
- 85-100: Excellent — polished and compelling, minor refinements only
- 70-84:  Strong — a solid resume with a few clear opportunities
- 50-69:  Developing — a good base that needs some meaningful work
- 0-49:   Needs work — significant, fundamental issues
Most genuine, complete resumes land between 60 and 85. Reserve scores under 50 for resumes with serious fundamental problems — not for a decent resume that just needs polish.

Return ONLY a valid JSON object — no markdown, no explanation, no extra text. The JSON must have exactly these keys:

{{
  "overall_score": <integer 0-100>,
  "summary": "<1-2 sentences: an honest, encouraging read of this specific resume's current state and its single biggest opportunity>",
  "strengths": [
    "<A specific strength, referencing actual resume content. Max 1 sentence.>",
    "...(up to 6 total)"
  ],
  "improvements": [
    {{
      "area": "<The section or topic, e.g. 'Work Experience', 'Skills', 'Summary'>",
      "issue": "<One sentence on the opportunity — constructive, never harsh>",
      "example_rewrite": "Before: <the candidate's ACTUAL wording, quoted verbatim from the resume> After: <a concrete, stronger rewrite of that exact line>"
    }},
    "...(only as many as genuinely apply, up to 8)"
  ],
  "missing_elements": [
    "<Only something genuinely absent AND expected for THIS person's field. No generic filler. Use an empty array if nothing important is missing.>"
  ],
  "ats_tips": [
    "<A specific tip grounded in THIS resume's wording or formatting. No boilerplate. Use an empty array if it is already clean.>"
  ]
}}

Rules:
- improvements must be objects with exactly the keys: area, issue, example_rewrite.
- example_rewrite MUST start with "Before:" and contain "After:", quoting the candidate's real text in the Before half.
- strengths, missing_elements, and ats_tips must be plain strings — not objects.
- Do not comment on dates, time, or chronology anywhere in the output.
- Ground everything in this resume's actual content — never generic advice.
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
    prompt = _PROMPT_TEMPLATE.format(resume_text=resume_text.strip())

    # Calls Gemini with retry/backoff; raises AIRateLimitError / AIServiceError.
    raw = generate(prompt)

    # Strip any accidental markdown code fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE)
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        # Don't leak the raw model output to the caller — log-friendly message only.
        raise AIServiceError("Gemini returned malformed output") from e

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

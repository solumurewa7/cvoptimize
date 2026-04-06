# services/analyzer.py
#
# The core AI analysis engine for CVOptimize.
#
# Given a job description and a resume's extracted text, this module:
#   1. Extracts skills/requirements from the job description (spaCy NLP)
#   2. Finds which skills appear verbatim in the resume (exact matching)
#   3. Finds near-matches using AI sentence embeddings (semantic matching)
#   4. Computes a fit score (0-100) and a fit badge (Low / Medium / Strong)
#
# WHY two matching passes?
#   Exact matching catches "Python" → "Python".
#   Semantic matching catches "JavaScript" → "JS", or "team leadership" → "led a team".
#   Together they give a much more complete picture than either alone.

import re
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ---------------------------------------------------------------------------
# Model loading (lazy, module-level singletons)
# ---------------------------------------------------------------------------
# We load models once and reuse them across requests.
# Loading takes ~2-5 seconds the first time a request hits this code.
# After that, they stay in memory for the lifetime of the Flask process.

_nlp = None          # spaCy NLP pipeline
_embedder = None     # sentence-transformers model


def _get_nlp():
    global _nlp
    if _nlp is None:
        # en_core_web_sm: small English model, good for noun chunk extraction.
        # Installed during setup: python -m spacy download en_core_web_sm
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def _get_embedder():
    global _embedder
    if _embedder is None:
        # all-MiniLM-L6-v2: small (80MB), fast, strong semantic understanding.
        # Downloaded automatically by sentence-transformers on first use.
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ---------------------------------------------------------------------------
# Step 1: Extract skills from the job description
# ---------------------------------------------------------------------------

# Words that appear in JDs but aren't skills (stop words for our domain).
_SKILL_STOP_WORDS = {
    "experience", "knowledge", "understanding", "ability", "skill", "skills",
    "years", "year", "work", "working", "strong", "good", "excellent",
    "proficient", "familiarity", "familiar", "background", "proven",
    "demonstrated", "solid", "hands", "hands-on", "preferred", "required",
    "plus", "bonus", "including", "such", "etc", "related", "relevant",
    "minimum", "least", "must", "nice", "have", "using", "use",
    # Common JD sentence starters / subjects that aren't skills
    "we", "candidate", "candidates", "team", "company", "role", "position",
    "job", "responsibilities", "requirements", "qualifications", "you",
    "applicant", "applicants", "person", "individual",
}

# Single uppercase tokens to exclude — typically abbreviations that aren't skills
_SINGLE_TOKEN_BLOCKLIST = {"ci", "cd", "rest", "api", "ui", "ux", "qa", "ba"}


def extract_skills_from_jd(jd_text: str) -> list[str]:
    """
    Extract candidate skills from a job description using spaCy NLP.

    Strategy:
      1. Run spaCy to get noun chunks (e.g., "machine learning", "REST APIs")
         and named entities (e.g., "Python", "AWS", "Google Cloud").
      2. Filter out phrases that are too long, too short, or are stop words.
      3. Deduplicate (case-insensitive).

    Returns a list of skill strings, e.g.:
      ["Python", "REST APIs", "machine learning", "Docker", "AWS"]
    """
    nlp = _get_nlp()
    doc = nlp(jd_text)

    candidates = set()

    # Noun chunks: multi-word phrases like "machine learning", "REST APIs"
    for chunk in doc.noun_chunks:
        skill = _clean_skill(chunk.text)
        if _is_valid_skill(skill):
            candidates.add(skill.lower())

    # Named entities: proper nouns like "Python", "AWS", "React"
    for ent in doc.ents:
        skill = _clean_skill(ent.text)
        if _is_valid_skill(skill):
            candidates.add(skill.lower())

    # Also extract individual tokens that look like tech keywords:
    # capitalized single words not at sentence start (e.g., "Docker", "SQL")
    for token in doc:
        if (
            token.is_alpha
            and len(token.text) >= 2
            and not token.is_stop
            and token.text[0].isupper()
            and not token.is_sent_start
            and token.text.lower() not in _SINGLE_TOKEN_BLOCKLIST
        ):
            skill = token.text.strip()
            if _is_valid_skill(skill):
                candidates.add(skill.lower())

    # Restore original casing: prefer the first form seen in the JD.
    # Build a mapping: lowercase → original casing
    casing_map = {}
    for chunk in list(doc.noun_chunks) + list(doc.ents):
        cleaned = _clean_skill(chunk.text)
        key = cleaned.lower()
        if key in candidates and key not in casing_map:
            casing_map[key] = cleaned
    for token in doc:
        key = token.text.lower()
        if key in candidates and key not in casing_map:
            casing_map[key] = token.text

    result = [casing_map.get(c, c) for c in candidates]
    return sorted(result, key=str.lower)


def _clean_skill(text: str) -> str:
    """Strip leading articles/determiners and extra whitespace."""
    # Remove leading "a", "an", "the", "our", "your", "their"
    text = re.sub(r"^(a|an|the|our|your|their)\s+", "", text.strip(), flags=re.IGNORECASE)
    return text.strip()


def _is_valid_skill(skill: str) -> bool:
    """Return True if the string looks like a skill worth keeping."""
    words = skill.split()
    if len(words) == 0 or len(words) > 5:
        return False                          # Too long to be a skill phrase
    if len(skill) < 2:
        return False                          # Single character
    lower_words = {w.lower() for w in words}
    if lower_words.issubset(_SKILL_STOP_WORDS):
        return False                          # All words are noise words
    return True


# ---------------------------------------------------------------------------
# Step 2: Exact matching
# ---------------------------------------------------------------------------

def exact_match(resume_text: str, jd_skills: list[str]) -> tuple[list[str], list[str]]:
    """
    Check which JD skills appear verbatim (case-insensitive) in the resume.

    Returns:
        matched:   skills found in the resume
        missing:   skills NOT found (passed to semantic matching next)
    """
    resume_lower = resume_text.lower()
    matched = []
    missing = []

    for skill in jd_skills:
        # Use word-boundary-aware search so "R" doesn't match inside "React"
        pattern = re.compile(r'\b' + re.escape(skill.lower()) + r'\b')
        if pattern.search(resume_lower):
            matched.append(skill)
        else:
            missing.append(skill)

    return matched, missing


# ---------------------------------------------------------------------------
# Step 3: Semantic matching
# ---------------------------------------------------------------------------

# Similarity threshold: pairs above this are considered a match.
# 0.55 is permissive enough to catch paraphrases without too many false positives.
SEMANTIC_THRESHOLD = 0.55

# We split the resume into overlapping chunks for embedding.
# Embedding the whole resume as one string loses granularity.
_CHUNK_SIZE = 100   # words per chunk
_CHUNK_OVERLAP = 20 # overlap between chunks


def semantic_match(
    resume_text: str,
    unmatched_skills: list[str],
    threshold: float = SEMANTIC_THRESHOLD,
) -> list[dict]:
    """
    Use sentence embeddings to find skills that are present in the resume
    but weren't caught by exact matching.

    For each unmatched skill, we compare its embedding to embeddings of
    resume text chunks. If any chunk is similar enough, it's a match.

    Returns a list of dicts:
      [{"jd_skill": "JavaScript", "resume_match": "JS", "similarity": 0.72}, ...]
    """
    if not unmatched_skills:
        return []

    embedder = _get_embedder()

    # --- Chunk the resume ---
    words = resume_text.split()
    chunks = []
    for i in range(0, len(words), _CHUNK_SIZE - _CHUNK_OVERLAP):
        chunk = " ".join(words[i : i + _CHUNK_SIZE])
        if chunk.strip():
            chunks.append(chunk)
    if not chunks:
        return []

    # --- Embed everything ---
    # encode() converts text to a dense vector (list of floats).
    # We embed all chunks and all skills in two batch calls (efficient).
    skill_embeddings = embedder.encode(unmatched_skills)        # shape: (n_skills, dim)
    chunk_embeddings = embedder.encode(chunks)                  # shape: (n_chunks, dim)

    # cosine_similarity returns a matrix: rows = skills, cols = chunks
    sim_matrix = cosine_similarity(skill_embeddings, chunk_embeddings)

    results = []
    for skill_idx, skill in enumerate(unmatched_skills):
        # Best matching chunk for this skill
        best_chunk_idx = int(np.argmax(sim_matrix[skill_idx]))
        best_score = float(sim_matrix[skill_idx][best_chunk_idx])

        if best_score >= threshold:
            # Extract a short snippet from the best chunk for display
            best_chunk_words = chunks[best_chunk_idx].split()
            snippet = " ".join(best_chunk_words[:8]) + ("..." if len(best_chunk_words) > 8 else "")
            results.append({
                "jd_skill": skill,
                "resume_match": snippet,
                "similarity": round(best_score, 3),
            })

    return results


# ---------------------------------------------------------------------------
# Step 4: Scoring
# ---------------------------------------------------------------------------

def compute_fit_score(
    total_skills: int,
    matched_count: int,
    semantic_count: int,
) -> int | None:
    """
    Compute an overall fit percentage.

    Exact matches are worth full credit.
    Semantic matches are worth 70% credit (they're approximate).

    Returns None if there were no skills detected (can't score).
    """
    if total_skills == 0:
        return None

    weighted = matched_count + (semantic_count * 0.7)
    score = round((weighted / total_skills) * 100)
    return min(score, 100)   # Cap at 100%


def compute_fit_badge(score: int | None) -> str | None:
    """Return 'Low', 'Medium', or 'Strong' based on the score."""
    if score is None:
        return None
    if score >= 70:
        return "Strong"
    if score >= 40:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Top-level: run the full analysis pipeline
# ---------------------------------------------------------------------------

def run_analysis(resume_text: str, jd_text: str) -> dict:
    """
    Run the full analysis pipeline and return a result dict.

    This is what the route calls — it wires together all the steps above.
    """
    # Step 1: extract skills from JD
    jd_skills = extract_skills_from_jd(jd_text)

    # Step 2: exact match
    matched, missing = exact_match(resume_text, jd_skills)

    # Step 3: semantic match on what's still missing
    semantic = semantic_match(resume_text, missing)
    semantic_skill_names = [s["jd_skill"] for s in semantic]

    # Skills that are truly missing (not found by either method)
    truly_missing = [s for s in missing if s not in semantic_skill_names]

    # Step 4: score
    fit_score = compute_fit_score(len(jd_skills), len(matched), len(semantic))
    fit_badge = compute_fit_badge(fit_score)

    return {
        "extracted_jd_skills": jd_skills,
        "matched_skills": matched,
        "missing_skills": truly_missing,
        "semantic_matches": semantic,
        "fit_score": fit_score,
        "fit_badge": fit_badge,
        "jd_snippet": jd_text[:150].strip(),
    }

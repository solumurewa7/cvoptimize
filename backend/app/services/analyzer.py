# services/analyzer.py
#
# AI analysis engine for CVOptimize.
#
# Pipeline:
#   1. Extract skills from the job description (spaCy NLP)
#   2. Exact match those skills against the resume
#   3. Semantic match remaining skills using sentence embeddings
#   4. Compute fit score + badge

import re
import spacy
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ---------------------------------------------------------------------------
# Lazy model loading
# ---------------------------------------------------------------------------
_nlp = None
_embedder = None

def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp

def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ---------------------------------------------------------------------------
# Step 1: Skill extraction
# ---------------------------------------------------------------------------

# Generic words that are never skills, no matter the context
_STOP_WORDS = {
    # Verbs / actions
    "assist", "build", "collaborate", "contribute", "debug", "develop",
    "gather", "help", "implement", "maintain", "participate", "resolve",
    "write", "use", "using", "work", "working", "ensure", "support",
    # Generic nouns
    "ability", "background", "busywork", "candidate", "candidates",
    "code", "company", "compensation", "defects", "end", "engineers",
    "environment", "experience", "exposure", "familiarity", "features",
    "field", "graduation", "guidance", "hands", "hourly", "individual",
    "knowledge", "mentorship", "networking", "offer", "person",
    "platforms", "potential", "proficiency", "qualifications",
    "requirements", "responsibilities", "return", "role", "schedule",
    "site", "skills", "solutions", "team", "time", "understanding",
    "users", "willingness", "years", "year",
    # Adjectives
    "basic", "clean", "competitive", "cross-functional", "daily",
    "documented", "excellent", "familiar", "full-time", "good",
    "hands-on", "hybrid", "motivated", "nice", "paid", "preferred",
    "prior", "proficient", "real", "related", "relevant", "remote",
    "senior", "solid", "strong", "testable",
    # Determiners / pronouns
    "a", "an", "the", "that", "this", "we", "you", "our", "their",
    "any", "all", "at", "least", "one", "or",
}

# US state abbreviations
_STATE_ABBREVS = {
    "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in",
    "ia","ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv",
    "nh","nj","nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn",
    "tx","ut","vt","va","wa","wv","wi","wy","dc",
}

# spaCy entity labels that are never skills
_NOISE_ENT_LABELS = {
    "GPE", "LOC", "DATE", "TIME", "MONEY", "CARDINAL",
    "PERCENT", "ORDINAL", "QUANTITY", "PERSON", "FAC", "NORP",
}

# spaCy entity labels that ARE skills (tools, companies, products)
_SKILL_ENT_LABELS = {"ORG", "PRODUCT", "WORK_OF_ART"}


def _normalize_jd(text: str) -> str:
    """Add sentence-ending punctuation at each line so spaCy parses correctly."""
    lines = []
    for line in text.splitlines():
        line = re.sub(r'^[\s•–—\-*·]+', '', line).strip()
        if not line:
            continue
        if line[-1] not in '.!?':
            line += '.'
        lines.append(line)
    return ' '.join(lines)


def _is_skill_phrase(phrase: str) -> bool:
    """Return True if this phrase is worth keeping as a skill candidate."""
    words = phrase.split()

    # Length: 1–3 words only
    if not words or len(words) > 3:
        return False

    # Minimum length
    if len(phrase) < 3:
        return False

    # No digits or currency characters
    if any(ch.isdigit() or ch in '$%()' for ch in phrase):
        return False

    lower_words = [w.lower() for w in words]

    # All words are stop words → not a skill
    if all(w in _STOP_WORDS for w in lower_words):
        return False

    # Single word rules
    if len(words) == 1:
        w = words[0]
        # Single lowercase word that's generic → skip
        if w[0].islower() and w.lower() in _STOP_WORDS:
            return False
        # State abbreviation
        if w.lower() in _STATE_ABBREVS:
            return False
        # Very generic lowercase single words (not proper nouns)
        if w[0].islower() and len(w) <= 4 and not w.isupper():
            return False

    return True


def extract_skills_from_jd(jd_text: str) -> list[str]:
    """
    Extract skills and requirements from a job description.
    Returns a deduplicated, sorted list of skill strings.
    """
    nlp = _get_nlp()
    doc = nlp(_normalize_jd(jd_text))

    candidates: dict[str, str] = {}  # lowercase → original casing

    # Mark tokens that belong to noise entities
    noise_token_ids = set()
    for ent in doc.ents:
        if ent.label_ in _NOISE_ENT_LABELS:
            noise_token_ids.update(range(ent.start, ent.end))

    # --- Named entities that ARE skills (ORG, PRODUCT, etc.) ---
    for ent in doc.ents:
        if ent.label_ in _SKILL_ENT_LABELS:
            phrase = ent.text.strip()
            if _is_skill_phrase(phrase):
                candidates[phrase.lower()] = phrase

    # --- Noun chunks ---
    for chunk in doc.noun_chunks:
        # Skip chunks overlapping with noise entities
        if any(tok.i in noise_token_ids for tok in chunk):
            continue

        phrase = chunk.text.strip()
        # Strip leading determiners/articles
        phrase = re.sub(r'^(a|an|the|our|your|their|any|one)\s+', '', phrase, flags=re.IGNORECASE).strip()

        if _is_skill_phrase(phrase):
            key = phrase.lower()
            if key not in candidates:
                candidates[key] = phrase

    # --- Also scan for slash-separated tech pairs like "HTML/CSS", "CI/CD" ---
    for match in re.finditer(r'\b([A-Z][A-Za-z0-9]*)/([A-Z][A-Za-z0-9]*)\b', jd_text):
        phrase = match.group(0)
        key = phrase.lower()
        if key not in candidates:
            candidates[key] = phrase

    return sorted(candidates.values(), key=str.lower)


# ---------------------------------------------------------------------------
# Step 2: Exact matching
# ---------------------------------------------------------------------------

def exact_match(resume_text: str, jd_skills: list[str]) -> tuple[list[str], list[str]]:
    """
    Case-insensitive word-boundary search for each skill in the resume.
    Returns (matched, unmatched).
    """
    resume_lower = resume_text.lower()
    matched, unmatched = [], []

    for skill in jd_skills:
        pattern = re.compile(r'\b' + re.escape(skill.lower()) + r'\b')
        if pattern.search(resume_lower):
            matched.append(skill)
        else:
            unmatched.append(skill)

    return matched, unmatched


# ---------------------------------------------------------------------------
# Step 3: Semantic matching
# ---------------------------------------------------------------------------

SEMANTIC_THRESHOLD = 0.45   # lower = more matches; raise if too many false positives


def semantic_match(
    resume_text: str,
    unmatched_skills: list[str],
    threshold: float = SEMANTIC_THRESHOLD,
) -> list[dict]:
    """
    Compare unmatched JD skills against individual resume sentences using
    sentence embeddings.

    Using sentences (not 100-word chunks) gives much sharper similarity
    scores because each sentence covers a focused topic.

    Returns:
      [{"jd_skill": "version control", "resume_match": "...", "similarity": 0.61}, ...]
    """
    if not unmatched_skills:
        return []

    # Split resume into sentences using spaCy
    nlp = _get_nlp()
    doc = nlp(resume_text)
    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]

    if not sentences:
        return []

    embedder = _get_embedder()
    skill_embs = embedder.encode(unmatched_skills)
    sent_embs = embedder.encode(sentences)

    sim_matrix = cosine_similarity(skill_embs, sent_embs)  # (n_skills, n_sents)

    results = []
    for i, skill in enumerate(unmatched_skills):
        best_j = int(np.argmax(sim_matrix[i]))
        best_score = float(sim_matrix[i][best_j])
        if best_score >= threshold:
            snippet = sentences[best_j][:80] + ('…' if len(sentences[best_j]) > 80 else '')
            results.append({
                "jd_skill": skill,
                "resume_match": snippet,
                "similarity": round(best_score, 3),
            })

    return results


# ---------------------------------------------------------------------------
# Step 4: Scoring
# ---------------------------------------------------------------------------

def compute_fit_score(total: int, matched: int, semantic: int) -> int | None:
    if total == 0:
        return None
    weighted = matched + (semantic * 0.7)
    return min(round((weighted / total) * 100), 100)


def compute_fit_badge(score: int | None) -> str | None:
    if score is None:
        return None
    if score >= 70:
        return "Strong"
    if score >= 40:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# Top-level pipeline
# ---------------------------------------------------------------------------

def run_analysis(resume_text: str, jd_text: str) -> dict:
    jd_skills = extract_skills_from_jd(jd_text)
    matched, unmatched = exact_match(resume_text, jd_skills)
    semantic = semantic_match(resume_text, unmatched)
    semantic_names = {s["jd_skill"] for s in semantic}
    truly_missing = [s for s in unmatched if s not in semantic_names]

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

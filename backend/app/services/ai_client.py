# services/ai_client.py
#
# Single shared entry point for every Google Gemini call in the app.
#
# WHY this exists:
#   Previously analyzer.py and improver.py each called Gemini directly and, on
#   any failure, re-raised the raw exception string (e.g. the full 429
#   "RESOURCE_EXHAUSTED" JSON blob) all the way to the user's screen. This module
#   centralises that so we can:
#     - classify failures into two clean, typed errors
#     - retry transient failures (rate limits / temporary outages) with backoff
#     - log the real underlying error server-side for debugging
#     - never leak raw API internals to the frontend
#
# Callers should catch AIRateLimitError / AIServiceError (or the AIError base).

import os
import time
import logging

from google import genai

logger = logging.getLogger(__name__)

MODEL = "gemini-2.5-flash"

# Retry tuning for transient failures (rate limit / temporary server errors).
# Kept conservative so the worst-case total (≈2×60s + backoff) stays inside the
# gunicorn worker timeout (see backend/gunicorn.conf.py) — otherwise a retry
# sequence could get the worker killed and surface as a misleading CORS error.
_MAX_ATTEMPTS = 2              # 1 initial try + 1 retry
_BACKOFF_SECONDS = (2,)        # wait before the retry
_REQUEST_TIMEOUT_MS = 60_000   # hard cap so a hung call can't block a worker forever
# Low temperature → the grader gives near-identical scores for the same input
# instead of swinging run-to-run. Keep a touch above 0 to avoid degenerate output.
_TEMPERATURE = 0.2
# Fixed seed → best-effort reproducibility, so the same resume scores the same
# on re-runs (Gemini Flash is otherwise non-deterministic even at temperature 0).
_SEED = 7


# ---------------------------------------------------------------------------
# Typed errors — routes translate these into user-facing HTTP responses
# ---------------------------------------------------------------------------

class AIError(Exception):
    """Base class for any AI-service failure."""


class AIRateLimitError(AIError):
    """The AI provider is rate-limiting / out of quota (HTTP 429)."""


class AIServiceError(AIError):
    """The AI provider failed for any other reason (network, 5xx, bad output)."""


# ---------------------------------------------------------------------------
# Lazy client loading (shared by analyzer + improver)
# ---------------------------------------------------------------------------
_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise AIServiceError(
                "GEMINI_API_KEY is not set. Add it to backend/.env and restart Flask."
            )
        _client = genai.Client(api_key=api_key)
    return _client


# ---------------------------------------------------------------------------
# Error classification
# ---------------------------------------------------------------------------

def _status_code(exc: Exception):
    """Best-effort extraction of an HTTP status code from a genai exception."""
    for attr in ("code", "status_code"):
        val = getattr(exc, attr, None)
        if isinstance(val, int):
            return val
    return None


def _is_rate_limit(exc: Exception) -> bool:
    if _status_code(exc) == 429:
        return True
    text = str(exc).lower()
    return "429" in text or "resource_exhausted" in text or "quota" in text or "rate limit" in text


def _is_transient(exc: Exception) -> bool:
    """Rate limits and 5xx server errors are worth retrying."""
    code = _status_code(exc)
    if code in (429, 500, 502, 503, 504):
        return True
    if _is_rate_limit(exc):
        return True
    text = str(exc).lower()
    return "unavailable" in text or "deadline" in text or "timeout" in text or "503" in text


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate(prompt: str, temperature: float = _TEMPERATURE) -> str:
    """
    Send a prompt to Gemini and return the raw text response.

    `temperature` controls run-to-run variability — lower = steadier/more
    deterministic (use ~0 for scoring that must be repeatable).

    Retries transient failures with exponential backoff. Raises:
        AIRateLimitError — provider is rate-limiting / out of quota
        AIServiceError   — any other failure (network, 5xx, empty response)
    """
    client = _get_client()
    last_exc = None

    for attempt in range(_MAX_ATTEMPTS):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config={
                    "temperature": temperature,
                    "seed": _SEED,
                    "http_options": {"timeout": _REQUEST_TIMEOUT_MS},
                },
            )
            text = (response.text or "").strip()
            if not text:
                raise AIServiceError("Gemini returned an empty response")
            return text

        except AIServiceError:
            raise  # empty-response case above — not worth retrying

        except Exception as exc:  # noqa: BLE001 — we deliberately classify all provider errors
            last_exc = exc

            if not _is_transient(exc) or attempt == _MAX_ATTEMPTS - 1:
                break

            wait = _BACKOFF_SECONDS[min(attempt, len(_BACKOFF_SECONDS) - 1)]
            logger.warning(
                "Gemini call failed (attempt %s/%s), retrying in %ss: %s",
                attempt + 1, _MAX_ATTEMPTS, wait, exc,
            )
            time.sleep(wait)

    # Out of retries — classify and raise a clean, typed error.
    if last_exc is not None and _is_rate_limit(last_exc):
        logger.warning("Gemini rate-limited: %s", last_exc)
        raise AIRateLimitError("Gemini rate limit / quota exceeded") from last_exc

    logger.error("Gemini call failed: %s", last_exc, exc_info=last_exc)
    raise AIServiceError(f"Gemini API call failed: {last_exc}") from last_exc

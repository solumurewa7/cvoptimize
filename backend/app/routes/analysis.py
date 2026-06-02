# routes/analysis.py
#
# Analysis routes — run an analysis, list history, get a single result.
#
# Routes:
#   POST /api/analyses          — run analysis against a resume + job description (auth required)
#   GET  /api/analyses          — list the user's analysis history
#   GET  /api/analyses/<id>     — get one full analysis result
#   POST /api/analyses/guest    — run analysis without auth; result not saved to DB

from datetime import datetime, timezone, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter.util import get_remote_address

from ..extensions import db, limiter
from ..models import Resume, Analysis
from ..services.analyzer import run_analysis

analysis_bp = Blueprint("analysis_bp", __name__)


# ---------------------------------------------------------------------------
# POST /api/analyses
# ---------------------------------------------------------------------------
@analysis_bp.route("", methods=["POST"])
@jwt_required()
@limiter.limit("20 per day", key_func=lambda: get_jwt_identity() or get_remote_address())
def create_analysis():
    """
    Run an AI analysis comparing a resume against a job description.

    Expected JSON body:
        {
            "resume_id": "<uuid>",
            "job_description": "<full JD text>"
        }

    Returns 201 with the full analysis result on success.
    """
    user_id = get_jwt_identity()

    # Rate limit: max 12 analyses per user per 5-minute window
    five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    recent_count = Analysis.query.filter(
        Analysis.user_id == user_id,
        Analysis.created_at >= five_min_ago
    ).count()
    if recent_count >= 12:
        return jsonify({
            "error": "You're analysing too quickly — please wait a moment before trying again."
        }), 429

    data = request.get_json(force=True, silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    resume_id = data.get("resume_id", "").strip()
    jd_text = data.get("job_description", "").strip()

    if not resume_id:
        return jsonify({"error": "resume_id is required"}), 400
    if not jd_text:
        return jsonify({"error": "job_description is required"}), 400
    if len(jd_text) < 50:
        return jsonify({"error": "Job description is too short to analyse"}), 400

    # --- Fetch and authorise the resume ---
    resume = db.session.get(Resume, resume_id)
    if not resume or str(resume.user_id) != user_id:
        return jsonify({"error": "Resume not found"}), 404

    # --- Run the analysis pipeline ---
    # This is the slow step (~1-3 seconds on first call while models load).
    try:
        result = run_analysis(resume.extracted_text, jd_text)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    # --- Save to database ---
    analysis = Analysis(
        user_id=user_id,
        resume_id=resume.id,
        job_description=jd_text,
        job_title=result.get("job_title"),
        company=result.get("company"),
        jd_snippet=result["jd_snippet"],
        extracted_jd_skills=result.get("extracted_jd_skills", []),
        matched_skills=result.get("matched_skills", []),
        missing_skills=result.get("missing_skills", []),
        semantic_matches=result.get("semantic_matches", []),
        strengths=result.get("strengths", []),
        gaps=result.get("gaps", []),
        fit_score=result["fit_score"],
        fit_badge=result["fit_badge"],
    )
    db.session.add(analysis)
    db.session.commit()

    return jsonify({
        "message": "Analysis complete",
        "analysis": analysis.to_dict(),
    }), 201


# ---------------------------------------------------------------------------
# GET /api/analyses
# ---------------------------------------------------------------------------
@analysis_bp.route("", methods=["GET"])
@jwt_required()
def list_analyses():
    """Return the user's analysis history, newest first (summary view)."""
    user_id = get_jwt_identity()

    analyses = (
        Analysis.query
        .filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    return jsonify({
        "analyses": [a.to_summary_dict() for a in analyses]
    }), 200


# ---------------------------------------------------------------------------
# GET /api/analyses/jd-history
# ---------------------------------------------------------------------------
@analysis_bp.route("/jd-history", methods=["GET"])
@jwt_required()
def jd_history():
    """
    Return the user's recent unique job descriptions for re-use on the Analyze page.
    Deduplicates by jd_snippet (keeps most recent per unique snippet).
    Returns up to 8 entries.
    """
    user_id = get_jwt_identity()

    recent = (
        Analysis.query
        .filter_by(user_id=user_id)
        .order_by(Analysis.created_at.desc())
        .limit(50)
        .all()
    )

    seen = set()
    unique = []
    for a in recent:
        key = (a.jd_snippet or "")[:80]
        if key and key not in seen:
            seen.add(key)
            unique.append({
                "id": str(a.id),
                "job_title": a.job_title,
                "jd_snippet": a.jd_snippet,
                "job_description": a.job_description,
                "created_at": a.created_at.isoformat(),
            })
        if len(unique) >= 8:
            break

    return jsonify({"jd_history": unique}), 200


# ---------------------------------------------------------------------------
# GET /api/analyses/<analysis_id>
# ---------------------------------------------------------------------------
@analysis_bp.route("/<uuid:analysis_id>", methods=["GET"])
@jwt_required()
def get_analysis(analysis_id):
    """Return a single full analysis result."""
    user_id = get_jwt_identity()
    analysis = db.session.get(Analysis, analysis_id)

    if not analysis or str(analysis.user_id) != user_id:
        return jsonify({"error": "Analysis not found"}), 404

    return jsonify({"analysis": analysis.to_dict()}), 200


# ---------------------------------------------------------------------------
# POST /api/analyses/guest
# ---------------------------------------------------------------------------
@analysis_bp.route("/guest", methods=["POST"])
@limiter.limit("5 per day")
def analyze_guest():
    """
    Run an AI analysis without authentication. Nothing is saved to the database.

    Accepts multipart/form-data:
        file            — PDF or DOCX resume (max 5 MB)
        job_description — plain text job description
    """
    from ..services.resume_parser import extract_text, count_words

    file = request.files.get("file")
    jd_text = request.form.get("job_description", "").strip()

    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    if not jd_text or len(jd_text) < 50:
        return jsonify({"error": "Job description is too short to analyse"}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ("pdf", "docx"):
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400

    file_bytes = file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        return jsonify({"error": "File exceeds 5 MB limit"}), 400

    try:
        resume_text = extract_text(file_bytes, ext)
    except Exception as e:
        return jsonify({"error": f"Could not read file: {str(e)}"}), 422

    if not resume_text.strip():
        return jsonify({"error": "Could not extract text from file"}), 422

    try:
        result = run_analysis(resume_text, jd_text)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    result["word_count"] = count_words(resume_text)
    return jsonify({"analysis": result}), 200

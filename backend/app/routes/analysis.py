# routes/analysis.py
#
# Analysis routes — run an analysis, list history, get a single result.
#
# Routes:
#   POST /api/analyses          — run analysis against a resume + job description
#   GET  /api/analyses          — list the user's analysis history
#   GET  /api/analyses/<id>     — get one full analysis result

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Resume, Analysis
from ..services.analyzer import run_analysis

analysis_bp = Blueprint("analysis_bp", __name__)


# ---------------------------------------------------------------------------
# POST /api/analyses
# ---------------------------------------------------------------------------
@analysis_bp.route("", methods=["POST"])
@jwt_required()
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
        jd_snippet=result["jd_snippet"],
        extracted_jd_skills=result["extracted_jd_skills"],
        matched_skills=result["matched_skills"],
        missing_skills=result["missing_skills"],
        semantic_matches=result["semantic_matches"],
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

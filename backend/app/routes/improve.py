# routes/improve.py
#
# Resume improvement routes.
#
# Routes:
#   POST /api/improve         — analyse a saved resume (auth required); result stored in resume.improvement_findings
#   POST /api/improve/guest   — analyse an uploaded file without auth; result not saved

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_limiter.util import get_remote_address

from ..extensions import db, limiter
from ..models import Resume
from ..services.improver import run_improvement

improve_bp = Blueprint("improve_bp", __name__)


# ---------------------------------------------------------------------------
# POST /api/improve
# ---------------------------------------------------------------------------
@improve_bp.route("", methods=["POST"])
@jwt_required()
@limiter.limit("20 per day", key_func=lambda: get_jwt_identity() or get_remote_address())
def improve_resume():
    """
    Run an AI improvement analysis on a saved resume.

    Expected JSON body:
        { "resume_id": "<uuid>" }

    Returns 200 with the full improvement result on success.
    The result is also persisted to resume.improvement_findings.
    """
    user_id = get_jwt_identity()
    data = request.get_json(force=True, silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    resume_id = data.get("resume_id", "").strip()
    if not resume_id:
        return jsonify({"error": "resume_id is required"}), 400

    # Fetch and authorise the resume
    resume = db.session.get(Resume, resume_id)
    if not resume or str(resume.user_id) != user_id:
        return jsonify({"error": "Resume not found"}), 404

    if not resume.extracted_text or not resume.extracted_text.strip():
        return jsonify({"error": "Resume has no extractable text"}), 422

    try:
        result = run_improvement(resume.extracted_text)
    except Exception as e:
        return jsonify({"error": f"Improvement analysis failed: {str(e)}"}), 500

    # Persist the result so the user can see it again without re-running
    resume.improvement_findings = result
    db.session.commit()

    return jsonify({"improvement": result}), 200


# ---------------------------------------------------------------------------
# POST /api/improve/guest
# ---------------------------------------------------------------------------
@improve_bp.route("/guest", methods=["POST"])
@limiter.limit("5 per day")
def improve_guest():
    """
    Run an AI improvement analysis without authentication. Nothing is saved.

    Accepts multipart/form-data:
        file — PDF or DOCX resume (max 5 MB)
    """
    from ..services.resume_parser import extract_text, count_words

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

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
        result = run_improvement(resume_text)
    except Exception as e:
        return jsonify({"error": f"Improvement analysis failed: {str(e)}"}), 500

    result["word_count"] = count_words(resume_text)
    return jsonify({"improvement": result}), 200

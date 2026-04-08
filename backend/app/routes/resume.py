# routes/resume.py
#
# Resume routes — upload, list, get, delete.
# All routes are protected: you must be logged in (valid JWT cookie).
#
# Routes:
#   POST   /api/resumes/upload   — upload a PDF or DOCX, parse it, save to DB
#   GET    /api/resumes          — list all resumes for the logged-in user
#   GET    /api/resumes/<id>     — get one resume (with full extracted text)
#   DELETE /api/resumes/<id>     — delete a resume

import io

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..extensions import db
from ..models import Resume
from ..services.resume_parser import extract_text, count_words, UnsupportedFileTypeError

resume_bp = Blueprint("resume_bp", __name__)

# Maximum file size: 5 MB. Larger files are almost certainly not resumes.
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB in bytes

ALLOWED_EXTENSIONS = {"pdf", "docx"}


def _get_file_type(filename: str) -> str | None:
    """Return 'pdf' or 'docx' from the filename, or None if not allowed."""
    if "." not in filename:
        return None
    ext = filename.rsplit(".", 1)[1].lower()
    return ext if ext in ALLOWED_EXTENSIONS else None


# ---------------------------------------------------------------------------
# POST /api/resumes/upload
# ---------------------------------------------------------------------------
@resume_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():
    """
    Upload a resume file (PDF or DOCX), extract its text, and save to DB.

    Request: multipart/form-data with a field named "file".
    Returns 201 with the saved resume on success.
    """
    user_id = get_jwt_identity()

    # --- Validate file presence ---
    # request.files is a dict-like object populated from multipart form data.
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send a multipart/form-data request with a 'file' field"}), 400

    file = request.files["file"]

    if not file.filename:
        return jsonify({"error": "File has no name"}), 400

    # --- Validate file type ---
    file_type = _get_file_type(file.filename)
    if not file_type:
        return jsonify({"error": "Only PDF and DOCX files are supported"}), 400

    # --- Read and validate file size ---
    # file.read() loads the entire file into memory as bytes.
    # For a resume (usually < 500KB), this is fine.
    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": "File too large. Maximum size is 5 MB"}), 413

    if len(file_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty"}), 400

    # --- Parse the file ---
    try:
        extracted_text = extract_text(file_bytes, file_type)
    except UnsupportedFileTypeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Could not parse the file. Make sure it is a valid PDF or DOCX"}), 422

    if not extracted_text.strip():
        return jsonify({"error": "No text could be extracted from the file. It may be a scanned image PDF"}), 422

    word_count = count_words(extracted_text)

    # --- Save to database ---
    resume = Resume(
        user_id=user_id,
        filename=file.filename,
        file_type=file_type,
        extracted_text=extracted_text,
        word_count=word_count,
        file_data=file_bytes,
    )
    db.session.add(resume)
    db.session.commit()

    return jsonify({
        "message": "Resume uploaded successfully",
        "resume": resume.to_dict(),
    }), 201


# ---------------------------------------------------------------------------
# GET /api/resumes
# ---------------------------------------------------------------------------
@resume_bp.route("", methods=["GET"])
@jwt_required()
def list_resumes():
    """
    Return all resumes belonging to the logged-in user, newest first.
    Does NOT include extracted_text (too large for a list view).
    """
    user_id = get_jwt_identity()

    resumes = (
        Resume.query
        .filter_by(user_id=user_id)
        .order_by(Resume.created_at.desc())
        .all()
    )

    return jsonify({
        "resumes": [r.to_dict() for r in resumes]
    }), 200


# ---------------------------------------------------------------------------
# GET /api/resumes/<resume_id>
# ---------------------------------------------------------------------------
@resume_bp.route("/<uuid:resume_id>", methods=["GET"])
@jwt_required()
def get_resume(resume_id):
    """
    Return a single resume, including its full extracted text.

    <uuid:resume_id> in the URL is automatically validated as a UUID by Flask.
    If the format is wrong, Flask returns 404 before this function runs.
    """
    user_id = get_jwt_identity()
    resume = db.session.get(Resume, resume_id)

    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    # Ownership check — users can only see their own resumes.
    if str(resume.user_id) != user_id:
        return jsonify({"error": "Resume not found"}), 404  # 404, not 403, to avoid leaking existence

    return jsonify({"resume": resume.to_dict(include_text=True)}), 200


# ---------------------------------------------------------------------------
# DELETE /api/resumes/<resume_id>
# ---------------------------------------------------------------------------
@resume_bp.route("/<uuid:resume_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(resume_id):
    """Delete a resume. Only the owner can delete their own resume."""
    user_id = get_jwt_identity()
    resume = db.session.get(Resume, resume_id)

    if not resume or str(resume.user_id) != user_id:
        return jsonify({"error": "Resume not found"}), 404

    db.session.delete(resume)
    db.session.commit()

    return jsonify({"message": "Resume deleted"}), 200


# ---------------------------------------------------------------------------
# GET /api/resumes/<resume_id>/file
# ---------------------------------------------------------------------------
@resume_bp.route("/<uuid:resume_id>/file", methods=["GET"])
@jwt_required()
def get_resume_file(resume_id):
    """
    Stream the original uploaded file back to the client.
    PDFs open inline in the browser; DOCX files trigger a download.
    Returns 404 if the file bytes were not stored (resumes uploaded before
    this feature was added).
    """
    user_id = get_jwt_identity()
    resume = db.session.get(Resume, resume_id)

    if not resume or str(resume.user_id) != user_id:
        return jsonify({"error": "Resume not found"}), 404

    if not resume.file_data:
        return jsonify({"error": "File not available for this resume"}), 404

    mime = "application/pdf" if resume.file_type == "pdf" else \
           "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return send_file(
        io.BytesIO(resume.file_data),
        mimetype=mime,
        as_attachment=False,          # inline — browser opens PDF viewer
        download_name=resume.filename,
    )

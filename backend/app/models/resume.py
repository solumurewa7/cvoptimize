# models/resume.py
#
# Defines the "Resume" table.
#
# A resume belongs to one user. One user can have multiple resumes
# (they might update it over time). We store only the EXTRACTED TEXT,
# not the original file — this is safer and cheaper on storage.

import uuid
from datetime import datetime, timezone

from ..extensions import db


class Resume(db.Model):
    __tablename__ = "resumes"

    # --- Columns ---

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Foreign key — links this resume to a specific user.
    # db.ForeignKey("users.id") means: this value must match an `id` in the `users` table.
    # ondelete="CASCADE" means: if the user is deleted, delete their resumes too
    # (this is the DATABASE-level enforcement; the Python-level cascade is in the
    # relationship defined on User).
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,     # Index so we can quickly find all resumes for a user
    )

    # Original filename — stored for display purposes ("your_resume_v2.pdf")
    filename = db.Column(db.String(255), nullable=False)

    # The raw text extracted from the PDF or DOCX.
    # db.Text = unlimited length text (PostgreSQL TEXT type).
    # This is the field all our AI/NLP analysis reads from.
    extracted_text = db.Column(db.Text, nullable=False)

    # JSON object storing the AI improvement analysis results.
    # Example structure:
    # {
    #   "findings": [
    #     {"type": "missing_section", "severity": "high", "message": "No Projects section found"},
    #     {"type": "passive_language", "severity": "medium", "message": "..."}
    #   ],
    #   "advisory_score": 72
    # }
    # db.JSON stores it as a PostgreSQL JSONB column — queryable and indexed.
    improvement_findings = db.Column(db.JSON, nullable=True)

    # How many words are in the resume — computed at upload time.
    # We use this for the "too short / too long" advisory check.
    word_count = db.Column(db.Integer, nullable=True)

    # "pdf" or "docx" — tells us which parser was used.
    file_type = db.Column(db.String(10), nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # --- Helper methods ---

    def to_dict(self, include_text: bool = False) -> dict:
        """
        Return a dictionary representation of this resume.

        include_text=False by default because extracted_text can be very long
        and most API responses don't need to send it — only the analysis does.
        """
        result = {
            "id": str(self.id),
            "filename": self.filename,
            "file_type": self.file_type,
            "word_count": self.word_count,
            "improvement_findings": self.improvement_findings,
            "created_at": self.created_at.isoformat(),
        }
        if include_text:
            result["extracted_text"] = self.extracted_text
        return result

    def __repr__(self) -> str:
        return f"<Resume {self.filename} (user={self.user_id})>"

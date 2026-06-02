# models/analysis.py
#
# Defines the "Analysis" table — one row per job description comparison.
#
# When a user pastes a job description and runs the analysis, we:
# 1. Extract skills from the JD
# 2. Match them against the resume (exact + semantic/AI)
# 3. Compute a fit score
# 4. Save ALL of that here so the user can revisit past analyses
#
# This is the most data-rich table in the whole app.

import uuid
from datetime import datetime, timezone

from ..extensions import db


class Analysis(db.Model):
    __tablename__ = "analyses"

    # --- Columns ---

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Which user ran this analysis?
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Which resume was used? We use SET NULL on delete (not CASCADE) because:
    # if the user deletes a resume, we keep the analysis record but just
    # lose the reference. The job data and score are still valuable history.
    resume_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,    # Can be null if the linked resume was deleted
    )

    # The full job description the user pasted in.
    # This can be very long (many paragraphs), so we use Text.
    job_description = db.Column(db.Text, nullable=False)

    # A short preview of the job description — shown in history cards
    # without loading the full text. Max 150 characters.
    # We compute this when saving (first 150 chars of the JD).
    jd_snippet = db.Column(db.String(150), nullable=True)

    # AI-extracted job title (e.g. "Senior Software Engineer"). Extracted by
    # Gemini at analysis time — no extra API call needed.
    job_title = db.Column(db.String(60), nullable=True)

    # AI-extracted company name from the JD (e.g. "Google"). Null if not mentioned.
    company = db.Column(db.String(80), nullable=True)

    # Relationship to Resume — lazy='joined' avoids N+1 when listing history.
    # nullable because resume_id uses SET NULL on delete.
    resume = db.relationship('Resume', foreign_keys=[resume_id], lazy='joined')

    # --- JSON columns for the analysis results ---
    # These are lists stored as JSON. PostgreSQL JSONB handles this natively.
    # JavaScript analogy: think of these as arrays saved in the database cell.

    # Skills we extracted from the job description.
    # Example: ["Python", "React", "PostgreSQL", "REST APIs", "teamwork"]
    extracted_jd_skills = db.Column(db.JSON, nullable=True)

    # Skills from the JD that we found in the resume (exact text match).
    # Example: ["Python", "React"]
    matched_skills = db.Column(db.JSON, nullable=True)

    # Skills from the JD that were NOT found in the resume.
    # Example: ["PostgreSQL", "REST APIs"]
    missing_skills = db.Column(db.JSON, nullable=True)

    # Skills matched by AI semantic similarity (not exact text).
    # These are matches where the JD says "JavaScript" and the resume says "JS".
    # Example:
    # [{"jd_skill": "JavaScript", "resume_match": "JS", "similarity": 0.78}]
    semantic_matches = db.Column(db.JSON, nullable=True)

    # The computed fit percentage (0-100).
    # Nullable — if no skills were detected in the JD, score stays None
    # and we show a friendly "no skills detected" message instead.
    fit_score = db.Column(db.Integer, nullable=True)

    # "Low", "Medium", or "Strong" — derived from fit_score.
    fit_badge = db.Column(db.String(10), nullable=True)

    # AI-generated bullet points (Gemini Flash output)
    # strengths: things in the resume that match the JD well (up to 10)
    # gaps:      things the JD requires that are absent or weak in the resume (up to 10)
    strengths = db.Column(db.JSON, nullable=True)
    gaps      = db.Column(db.JSON, nullable=True)

    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # --- Composite index ---
    # When we load a user's history, we always filter by user_id AND sort
    # by created_at newest-first. A composite index on both columns makes
    # this query lightning fast, even with thousands of rows.
    __table_args__ = (
        db.Index("ix_analyses_user_created", "user_id", "created_at"),
    )

    # --- Helper methods ---

    def to_summary_dict(self) -> dict:
        """
        Short representation for the history list view.
        Does NOT include full job_description — just what's needed to render
        a history card including hover stats.
        """
        return {
            "id":                   str(self.id),
            "resume_id":            str(self.resume_id) if self.resume_id else None,
            "resume_filename":      self.resume.filename if self.resume else None,
            "job_title":            self.job_title,
            "company":              self.company,
            "jd_snippet":           self.jd_snippet,
            "fit_score":            self.fit_score,
            "fit_badge":            self.fit_badge,
            "strengths_count":      len(self.strengths or []),
            "gaps_count":           len(self.gaps or []),
            "matched_skills_count": len(self.matched_skills or []),
            "created_at":           self.created_at.isoformat(),
        }

    def to_dict(self) -> dict:
        """Full representation — used when viewing a specific analysis."""
        return {
            "id": str(self.id),
            "resume_id": str(self.resume_id) if self.resume_id else None,
            "resume_filename": self.resume.filename if self.resume else None,
            "job_title": self.job_title,
            "company": self.company,
            "job_description": self.job_description,
            "jd_snippet": self.jd_snippet,
            "extracted_jd_skills": self.extracted_jd_skills,
            "matched_skills": self.matched_skills or [],
            "missing_skills": self.missing_skills or [],
            "semantic_matches": self.semantic_matches or [],
            "strengths": self.strengths or [],
            "gaps": self.gaps or [],
            "fit_score": self.fit_score,
            "fit_badge": self.fit_badge,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        return f"<Analysis score={self.fit_score} badge={self.fit_badge} user={self.user_id}>"

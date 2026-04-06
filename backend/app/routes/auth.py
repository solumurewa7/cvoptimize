# routes/auth.py
#
# A "Blueprint" is Flask's way of organizing routes into separate files.
# Think of it like a section of a binder — auth routes live here,
# resume routes live in resume.py, etc.
#
# This file is a PLACEHOLDER for now. We'll fill in all the real
# register/login/logout logic in Phase 3.

from flask import Blueprint

# Blueprint("auth_bp", __name__) creates the blueprint.
# "auth_bp" is its internal name (used for url_for() lookups).
# __name__ is the current module — Flask uses it for error messages.
auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/ping")
def ping():
    """Temporary route to verify the auth blueprint is registered."""
    return {"message": "auth blueprint online"}, 200

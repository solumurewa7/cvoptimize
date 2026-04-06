# routes/auth.py
#
# Auth routes — register, login, logout, and /me.
#
# All routes live at /api/auth/... (the prefix is set in create_app()).
#
# HOW JWT COOKIES WORK IN THIS APP:
# When a user logs in, Flask sets two cookies in the browser:
#   1. access_token_cookie  — the actual JWT (httpOnly, not readable by JS)
#   2. csrf_access_token    — a readable token JS must echo back as a header
#                             on any state-changing request (POST, DELETE, etc.)
# This two-cookie pattern protects against CSRF attacks while keeping the
# JWT itself safe from XSS (since it's httpOnly).

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
)

from ..extensions import db
from ..models import User

auth_bp = Blueprint("auth_bp", __name__)


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Create a new user account.

    Expected JSON body:
        { "email": "...", "password": "...", "full_name": "..." }

    Returns 201 on success, 400 on bad input, 409 if email already exists.
    """
    data = request.get_json(force=True, silent=True)

    # --- Validate input ---
    # force=True parses as JSON regardless of Content-Type header.
    # silent=True returns None instead of raising an error on bad JSON.
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    # --- Check for duplicate email ---
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    # --- Create the user ---
    user = User(
        email=email,
        full_name=full_name or None,
        # NOTE: Email verification is not wired up yet (SendGrid phase).
        # Setting is_verified=True for now so users can log in immediately.
        # We'll flip this to False and send a verification email in a later phase.
        is_verified=True,
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # --- Issue JWT and set cookies ---
    # The identity stored in the token is the user's UUID (as a string).
    # We retrieve it later with get_jwt_identity() in protected routes.
    access_token = create_access_token(identity=str(user.id))
    response = jsonify({"message": "Account created", "user": user.to_dict()})
    set_access_cookies(response, access_token)

    return response, 201


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Log in with email + password.

    Expected JSON body:
        { "email": "...", "password": "..." }

    Returns 200 + sets JWT cookies on success.
    Returns 400 on missing fields, 401 on wrong credentials.
    """
    data = request.get_json(force=True, silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # --- Look up the user ---
    user = User.query.filter_by(email=email).first()

    # IMPORTANT: we give the same vague error whether the email doesn't exist
    # OR the password is wrong. This prevents "user enumeration" attacks where
    # an attacker could figure out which emails are registered just from the
    # error message.
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # --- Issue JWT and set cookies ---
    access_token = create_access_token(identity=str(user.id))
    response = jsonify({"message": "Logged in", "user": user.to_dict()})
    set_access_cookies(response, access_token)

    return response, 200


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------
@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Log out the current user by clearing the JWT cookies.

    No request body needed. Anyone can call this — even if not logged in,
    it's safe to clear cookies.
    """
    response = jsonify({"message": "Logged out"})
    unset_jwt_cookies(response)
    return response, 200


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    Return the currently logged-in user's profile.

    @jwt_required() means: if there's no valid JWT cookie, Flask-JWT-Extended
    automatically returns a 401 before this function even runs.

    Use this on the frontend to check if the user is still logged in
    (e.g., on page load) and to fetch their name/email to display.
    """
    # get_jwt_identity() reads the user ID we stored in the token at login.
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)

    if not user:
        # Token is valid but the user was deleted — clear cookies and 401.
        response = jsonify({"error": "User not found"})
        unset_jwt_cookies(response)
        return response, 401

    return jsonify({"user": user.to_dict()}), 200

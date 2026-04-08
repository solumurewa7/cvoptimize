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

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    set_access_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
)

from ..extensions import db
from ..models import User
from ..services.email import send_password_reset_email, send_verification_email

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
        is_verified=False,
    )
    user.set_password(password)
    token = user.set_verification_token()

    db.session.add(user)
    db.session.commit()

    # Send verification email (fire-and-forget — don't fail registration if email errors)
    try:
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        verify_url = f"{frontend_url}/verify-email?token={token}"
        send_verification_email(user.email, verify_url)
    except Exception:
        pass

    # --- Issue JWT and set cookies ---
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


# ---------------------------------------------------------------------------
# POST /api/auth/forgot-password
# ---------------------------------------------------------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    user = User.query.filter_by(email=email).first()

    # Always return 200 — never reveal whether the email is registered.
    if user:
        token = user.set_reset_token()
        db.session.commit()
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        reset_url    = f"{frontend_url}/reset-password?token={token}"
        try:
            send_password_reset_email(user.email, reset_url)
        except Exception:
            pass  # Don't expose email errors to the client

    return jsonify({"message": "If that email is registered, a reset link has been sent."}), 200


# ---------------------------------------------------------------------------
# PUT /api/auth/profile
# ---------------------------------------------------------------------------
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user    = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data     = request.get_json(force=True, silent=True) or {}
    new_name  = data.get("full_name", user.full_name)
    new_email = (data.get("email") or "").strip().lower() or user.email

    if new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "That email is already in use"}), 409
        user.email = new_email

    user.full_name = (new_name or "").strip() or None
    db.session.commit()
    return jsonify({"user": user.to_dict()}), 200


# ---------------------------------------------------------------------------
# PUT /api/auth/password
# ---------------------------------------------------------------------------
@auth_bp.route("/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user    = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data             = request.get_json(force=True, silent=True) or {}
    current_password = data.get("current_password", "")
    new_password     = data.get("new_password", "")

    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated"}), 200


# ---------------------------------------------------------------------------
# DELETE /api/auth/account
# ---------------------------------------------------------------------------
@auth_bp.route("/account", methods=["DELETE"])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    user    = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data     = request.get_json(force=True, silent=True) or {}
    password = data.get("password", "")

    if not user.check_password(password):
        return jsonify({"error": "Incorrect password"}), 400

    db.session.delete(user)
    db.session.commit()

    response = jsonify({"message": "Account deleted"})
    unset_jwt_cookies(response)
    return response, 200


# ---------------------------------------------------------------------------
# POST /api/auth/reset-password
# ---------------------------------------------------------------------------
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data     = request.get_json(force=True, silent=True) or {}
    token    = (data.get("token") or "").strip()
    password = data.get("password") or ""

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_valid():
        return jsonify({"error": "This reset link is invalid or has expired."}), 400

    user.set_password(password)
    user.clear_reset_token()
    db.session.commit()

    return jsonify({"message": "Password updated — you can now log in."}), 200


# ---------------------------------------------------------------------------
# GET /api/auth/verify-email?token=...
# ---------------------------------------------------------------------------
@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token", "").strip()
    user  = User.query.filter_by(verification_token=token).first()

    if not user or not user.verification_token_valid():
        return jsonify({"error": "Invalid or expired verification link"}), 400

    user.is_verified = True
    user.clear_verification_token()
    db.session.commit()

    return jsonify({"message": "Email verified"}), 200


# ---------------------------------------------------------------------------
# POST /api/auth/resend-verification
# ---------------------------------------------------------------------------
@auth_bp.route("/resend-verification", methods=["POST"])
@jwt_required()
def resend_verification():
    user_id = get_jwt_identity()
    user    = db.session.get(User, user_id)

    # Silent success if already verified — don't leak state
    if not user or user.is_verified:
        return jsonify({"message": "ok"}), 200

    token = user.set_verification_token()
    db.session.commit()

    try:
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
        verify_url   = f"{frontend_url}/verify-email?token={token}"
        send_verification_email(user.email, verify_url)
    except Exception:
        pass

    return jsonify({"message": "Verification email sent — check your inbox"}), 200

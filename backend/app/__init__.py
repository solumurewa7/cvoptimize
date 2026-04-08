# app/__init__.py
#
# The "application factory" — a function that builds and returns a
# fully configured Flask app.
#
# WHY a function instead of just `app = Flask(__name__)` at the top?
# Because you might need MULTIPLE app instances:
#   - One for development (with debug mode, local DB)
#   - One for testing (with an in-memory DB, no email sending)
#   - One for production (HTTPS, real DB, strict security)
# A factory function lets you create the right app for each context.

import os
from flask import Flask, jsonify
from flask_cors import CORS

from .config import config_by_name
from .extensions import db, migrate, jwt, limiter


def create_app(config_name: str = None) -> Flask:
    """
    Build and return a configured Flask application.

    Args:
        config_name: "development", "production", or "testing".
                     If None, reads from the FLASK_ENV environment variable.
                     Defaults to "development".
    """
    # If no config name is passed, check the environment variable.
    # This is how Render (the live server) tells Flask to use production settings.
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    # Flask(__name__) creates the app.
    # __name__ is just the Python module name ("app") —
    # Flask uses it to find your templates and static files.
    app = Flask(__name__)

    # Load the config class (DevelopmentConfig, ProductionConfig, etc.)
    # onto the app. This sets app.config["SECRET_KEY"], app.config["DEBUG"], etc.
    app.config.from_object(config_by_name[config_name])

    # --- Initialize extensions ---
    # Remember extensions.py? Now we "plug them in" to this specific app.
    # db.init_app(app) connects SQLAlchemy to the database URL in app.config.
    db.init_app(app)
    migrate.init_app(app, db)  # Migrate needs both the app AND the db
    jwt.init_app(app)
    limiter.init_app(app)

    # Return a clean JSON 429 instead of Flask-Limiter's default HTML page
    from flask_limiter.errors import RateLimitExceeded
    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit(_e):
        return jsonify({"error": "Too many requests — please wait before trying again"}), 429

    # --- CORS (Cross-Origin Resource Sharing) ---
    # Your React app runs on localhost:5173.
    # Your Flask API runs on localhost:5000.
    # Browsers block requests between different origins by default (security feature).
    # CORS tells the browser: "it's okay, I trust requests from this frontend URL."
    #
    # supports_credentials=True is CRITICAL — without it, the browser
    # won't send the httpOnly JWT cookie along with API requests.
    frontend_url = app.config.get("FRONTEND_URL", "http://localhost:5173")
    CORS(app,
         origins=[frontend_url],
         supports_credentials=True,
         allow_headers=["Content-Type", "X-CSRF-TOKEN"])

    # --- Import models ---
    # We import models INSIDE create_app() to avoid circular imports.
    # This import makes SQLAlchemy and Flask-Migrate aware of all three tables.
    # Without this line, `flask db migrate` would generate an empty migration
    # because it wouldn't know the User, Resume, and Analysis models exist.
    from . import models  # noqa: F401

    # --- Register Blueprints ---
    # A "Blueprint" is a group of related routes.
    # We split routes into separate files (auth.py, resume.py, analysis.py)
    # and register them here. Each gets a URL prefix like /api/auth/...
    #
    # We import them here (not at the top of the file) to avoid circular imports.
    # By the time these lines run, the app + db are already set up.
    from .routes.auth import auth_bp
    from .routes.resume import resume_bp
    from .routes.analysis import analysis_bp
    from .routes.improve import improve_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(resume_bp, url_prefix="/api/resumes")
    app.register_blueprint(analysis_bp, url_prefix="/api/analyses")
    app.register_blueprint(improve_bp, url_prefix="/api/improve")

    # Health check route — used to verify the server is running.
    # Render and other platforms ping this to check if your app is alive.
    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "CVOptimize API"}, 200

    return app

# config.py
#
# Different environments (your laptop vs. the live server) need
# different settings. For example:
#   - On your laptop: DEBUG=True so you see detailed error messages
#   - On the live server: DEBUG=False so users don't see internal errors
#
# We use Python classes here. The app will pick the right class
# based on an environment variable called FLASK_ENV.

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load .env from the backend/ directory (one level above this file's app/ folder).
# Using an absolute path means this works regardless of which directory
# the server is started from.
load_dotenv(Path(__file__).parent.parent / ".env", override=True)


class Config:
    """Base config — settings shared by ALL environments."""

    # SECRET_KEY: Flask uses this to sign cookies and tokens.
    # If someone knows your secret key, they can forge tokens.
    # NEVER hardcode this. Always read it from environment variables.
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")

    # Where to find the database. SQLAlchemy reads this URL and
    # connects automatically. Format: postgresql://user:pass@host/dbname
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://localhost/cvooptimize_dev")

    # Disable a SQLAlchemy feature that sends you a warning every
    # time the database is modified — we don't need it.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- JWT (login token) settings ---

    # Tell Flask-JWT-Extended to look for the token in cookies,
    # not in the Authorization header (which is the default).
    JWT_TOKEN_LOCATION = ["cookies"]

    # Only send the cookie over HTTPS. We set this to False in dev
    # because localhost doesn't use HTTPS.
    JWT_COOKIE_SECURE = False

    # "Lax" means the cookie is sent on same-site requests AND on
    # top-level navigation from other sites. This prevents most CSRF attacks
    # while still allowing normal use.
    JWT_COOKIE_SAMESITE = "Lax"

    # How long before the login token expires. 7 days = user stays
    # logged in for a week without needing to re-enter their password.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Enable Flask-JWT-Extended's built-in CSRF protection.
    # It sets a second readable cookie that your frontend must echo
    # back as a header on state-changing requests (POST, DELETE, etc.).
    JWT_COOKIE_CSRF_PROTECT = True

    # SendGrid (email sending) settings
    SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL = os.environ.get("SENDGRID_FROM_EMAIL", "noreply@cvooptimize.com")

    # The URL of your frontend app — used to build verification email links
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


class DevelopmentConfig(Config):
    """Settings for running on your laptop."""
    DEBUG = True
    SQLALCHEMY_ECHO = False
    # CSRF is a browser-only attack vector — disable in dev so curl/Postman work.
    # Production keeps it enabled via the base Config.
    JWT_COOKIE_CSRF_PROTECT = False


class ProductionConfig(Config):
    """Settings for the live server (Render)."""
    DEBUG = False
    JWT_COOKIE_SECURE = True      # HTTPS only in production
    # Frontend and backend are on different subdomains (cross-origin).
    # SameSite=None is required so browsers include the JWT cookie on
    # cross-origin fetch requests. Must be paired with Secure=True.
    JWT_COOKIE_SAMESITE = "None"
    # CSRF cookies are set on the backend domain — JavaScript on the
    # frontend domain cannot read them (cross-origin cookie isolation).
    # CORS already restricts requests to our known frontend origin,
    # so the CSRF risk is covered without the extra token check.
    JWT_COOKIE_CSRF_PROTECT = False


class TestingConfig(Config):
    """Settings for automated tests."""
    TESTING = True
    # Use a separate in-memory database for tests so they don't
    # mess up your real data
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_COOKIE_CSRF_PROTECT = False  # Easier to test without CSRF


# A lookup dictionary so we can do config_by_name["development"]
config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}

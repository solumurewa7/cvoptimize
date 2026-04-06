# models/user.py
#
# This file defines the "User" table using SQLAlchemy.
#
# SQLAlchemy is an ORM — Object-Relational Mapper.
# "ORM" means: instead of writing raw SQL like:
#
#   CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR UNIQUE, ...);
#   INSERT INTO users (email, ...) VALUES ('x@y.com', ...);
#   SELECT * FROM users WHERE email = 'x@y.com';
#
# ...you write Python classes and call Python methods.
# SQLAlchemy translates them into SQL for you.
#
# JavaScript analogy: this is like a Mongoose schema in Node.js,
# but for Python/PostgreSQL.

import uuid
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

from ..extensions import db

# db.Model is the base class every SQLAlchemy model inherits from.
# Inheriting it tells SQLAlchemy: "this class = one database table."
class User(db.Model):
    # __tablename__ sets the actual table name in PostgreSQL.
    # Convention: lowercase, plural, underscored.
    __tablename__ = "users"

    # --- Columns ---
    # Each class attribute = one column in the database table.
    # db.Column(type, options) defines a column.

    # UUID primary key.
    # UUID = Universally Unique Identifier — a 128-bit random string like:
    #   "550e8400-e29b-41d4-a716-446655440000"
    # Why UUID instead of an auto-incrementing integer (1, 2, 3...)?
    # - UUIDs are unguessable — a user can't enumerate other users' IDs
    # - They work safely across distributed systems
    # default= means: if no id is provided, generate one automatically.
    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Email address — must be unique across all users.
    # nullable=False means this field is REQUIRED (can't be empty/null).
    # index=True creates a database index, making lookups by email very fast.
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # We NEVER store raw passwords — always store a hashed version.
    # Hashing is one-way: you can verify a password against the hash,
    # but you can't reverse the hash back to the original password.
    # Even if someone steals the database, they can't recover passwords.
    password_hash = db.Column(db.String(255), nullable=False)

    # The user's display name — optional (nullable=True is the default).
    full_name = db.Column(db.String(100))

    # Whether the user has clicked the verification link in their email.
    # New users start as unverified (False) and can't use the app until verified.
    # server_default="false" writes a default at the DATABASE level, not just Python.
    # This matters for raw SQL inserts that bypass SQLAlchemy.
    is_verified = db.Column(db.Boolean, nullable=False, server_default="false")

    # When was this account created?
    # datetime.now(timezone.utc) = current time in UTC (always store UTC in databases,
    # convert to the user's timezone in the frontend).
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # --- Relationships ---
    # This tells SQLAlchemy that one User can have MANY Resumes.
    # It's not a database column — it's a Python convenience that lets
    # you do: user.resumes → returns a list of that user's Resume objects.
    #
    # cascade="all, delete-orphan" means: if a user is deleted,
    # automatically delete all their resumes too.
    # lazy="dynamic" means: don't load resumes from the DB until you ask for them.
    resumes = db.relationship(
        "Resume",
        backref="owner",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    # Same for analyses.
    analyses = db.relationship(
        "Analysis",
        backref="owner",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    # --- Helper methods ---
    # These aren't columns — they're Python methods attached to the model
    # to make common operations cleaner to write elsewhere.

    def set_password(self, password: str) -> None:
        """Hash a plain-text password and store it."""
        # generate_password_hash uses bcrypt internally.
        # The resulting hash is a long string like:
        #   "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Return True if the given password matches the stored hash."""
        # check_password_hash rehashes the input and compares.
        # It's safe against timing attacks.
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        """Return a safe dictionary representation (no password hash!)."""
        return {
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat(),
        }

    def __repr__(self) -> str:
        """Readable debug representation — shows up in terminal/logs."""
        return f"<User {self.email}>"

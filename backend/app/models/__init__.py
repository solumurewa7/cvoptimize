# models/__init__.py
#
# This file does two things:
# 1. Makes models/ a Python package (so `from app.models import User` works)
# 2. Imports all three model classes so they're available from one place
#
# WHY import them here?
# Flask-Migrate needs to "see" every model before it can generate a migration.
# When we call `flask db migrate`, Flask-Migrate inspects all models that have
# been imported into memory. If a model was never imported, it won't create a
# table for it.
#
# By importing here, and then importing this __init__ in create_app(),
# we guarantee all three models are loaded at startup.

from .user import User
from .resume import Resume
from .analysis import Analysis

# __all__ is a Python convention — it controls what gets exported when
# someone writes `from app.models import *`.
# It's optional but makes the public API of this package explicit.
__all__ = ["User", "Resume", "Analysis"]

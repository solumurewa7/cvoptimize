# extensions.py
#
# This file creates our "tools" without connecting them to the app yet.
# Think of it like buying appliances before you have a house —
# you'll plug them in later inside create_app().
#
# Why do this? If these lived inside __init__.py, and models.py imported
# from __init__.py, and __init__.py imported models.py, Python would
# freeze trying to resolve the loop. This pattern breaks that cycle.

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

# SQLAlchemy: our database ORM (Object-Relational Mapper).
# "ORM" means we write Python classes instead of raw SQL.
# Instead of: SELECT * FROM users WHERE id = 1
# We write:   User.query.get(1)
db = SQLAlchemy()

# Migrate: tracks changes to our database schema over time.
# When you add a new column to a model, Migrate generates a
# "migration file" that updates the real database safely.
migrate = Migrate()

# JWTManager: handles creating and verifying JSON Web Tokens.
# A JWT is a signed string that proves "this request came from user X".
# We store it in an httpOnly cookie so JavaScript can't steal it.
jwt = JWTManager()

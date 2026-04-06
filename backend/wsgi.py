# wsgi.py
#
# On Render (the live server), we don't use `python run.py`.
# Instead, Render uses a production-grade server called Gunicorn:
#   gunicorn wsgi:app
#
# Gunicorn looks for a variable named `app` in this file.
# That's all this file does — expose the app for Gunicorn to find.

from app import create_app

app = create_app("production")

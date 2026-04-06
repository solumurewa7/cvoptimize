# run.py
#
# This is how you start the Flask server during development.
# You run: python run.py
# (Or: flask run — Flask finds this file automatically via FLASK_APP env var)
#
# It calls create_app() to build the app, then starts a local web server.

from app import create_app

app = create_app("development")

if __name__ == "__main__":
    # debug=True means:
    #   1. Flask auto-reloads when you save a file (no need to restart)
    #   2. You get a detailed error page in the browser on crashes
    # NEVER use debug=True in production — it exposes internal code.
    app.run(debug=True, port=5000)

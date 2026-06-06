# gunicorn.conf.py
#
# Gunicorn auto-loads this file when started from the backend/ directory
# (i.e. the existing `gunicorn wsgi:app` start command picks it up — no need
# to change the Render start command).
#
# WHY: AI (Gemini) calls for /api/analyses and /api/improve legitimately take
# 30-60s. Gunicorn's DEFAULT worker timeout is 30s, so slow calls were getting
# the worker killed mid-request. The browser then sees a 502 with no CORS header
# and reports it as a misleading "No 'Access-Control-Allow-Origin'" error.
#
# 180s comfortably covers a slow generation plus the ai_client retry budget.

import os

timeout = 180          # max seconds a worker may spend on one request
graceful_timeout = 30  # seconds to finish in-flight requests on restart

# Threads let one worker handle other requests while an AI call is waiting on
# the network, so a slow analysis doesn't block the rest of the app. Tuneable
# via env without a code change.
workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
threads = int(os.environ.get("GUNICORN_THREADS", "4"))

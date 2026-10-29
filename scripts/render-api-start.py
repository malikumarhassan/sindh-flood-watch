"""Free demo web-process entry point: migrate before accepting HTTP requests.

Fictional seed data is opt-in. No default account or recurring worker is started.
"""

import os
import subprocess
import sys

if not os.getenv("DATABASE_URL", "").startswith(("postgresql://", "postgres://", "postgresql+psycopg://")):
    raise SystemExit("Set DATABASE_URL to your private Neon PostgreSQL URL before deploying")
subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)
if os.getenv("SFW_SEED_DEMO") == "true":
    subprocess.run([sys.executable, "-m", "services.api.manage", "seed"], check=True)
os.execvp(
    sys.executable,
    [
        sys.executable,
        "-m",
        "uvicorn",
        "services.api.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        os.getenv("PORT", "10000"),
        "--root-path",
        "/api",
        "--no-access-log",
    ],
)

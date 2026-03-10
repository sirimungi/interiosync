import os

# Use SQLite for local dev when no DATABASE_URL (no Docker/PostgreSQL needed)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./interior.db",
)
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")

import os

# Railway injects DATABASE_URL as 'postgres://...' but SQLAlchemy requires 'postgresql://...'
_raw_db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/interior")
DATABASE_URL = _raw_db_url.replace("postgres://", "postgresql://", 1) if _raw_db_url.startswith("postgres://") else _raw_db_url
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/uploads")

# Indian market (INTERIOSYNC)
DEFAULT_CURRENCY = "INR"
DEFAULT_TIMEZONE = "Asia/Kolkata"
DEFAULT_GST_RATE = float(os.getenv("DEFAULT_GST_RATE", "18"))  # 18% GST common for services

# SMTP email (optional — if not set, temp_password is returned in the API response instead)
MAIL_SERVER   = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT     = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM     = os.getenv("MAIL_FROM", "")

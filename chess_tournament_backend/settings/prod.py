from .base import *
from decouple import config, Csv
import dj_database_url

SECRET_KEY = config("SECRET_KEY")

# Always False in production
DEBUG = False

# Comma-separated list from env, e.g. "api.myapp.com,www.myapp.com"
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

# Database uses Render PostgreSQL by default, with sqlite fallback if missing
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR}/db.sqlite3",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Production CORS
# e.g. "https://myapp.vercel.app,https://www.myapp.com"
CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", cast=Csv(), default="")

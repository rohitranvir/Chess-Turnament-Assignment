from .base import *
from decouple import config, Csv

SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key")
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# SQLite for local dev
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# CORS for local Vite dev server
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

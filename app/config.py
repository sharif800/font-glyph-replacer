import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-987654321")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "password123")
PORT = int(os.getenv("PORT", 8000))

UPLOAD_DIR = "/tmp/font_replacer_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

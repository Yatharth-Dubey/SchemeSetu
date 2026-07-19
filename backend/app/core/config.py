from pathlib import Path

# ============================================
# BASE DIRECTORIES
# ============================================

BASE_DIR = Path(__file__).resolve().parents[2]

APP_DIR = BASE_DIR / "app"

STORAGE_DIR = BASE_DIR / "storage"

# ============================================
# DEFAULT DEVELOPMENT USER
# ============================================

DEFAULT_USER = "local_dev"

USER_DIR = STORAGE_DIR / "users" / DEFAULT_USER

UPLOAD_DIR = USER_DIR / "uploads"

PROCESSED_DIR = USER_DIR / "processed"

VECTOR_DIR = USER_DIR / "vectors"

# ============================================
# CREATE DIRECTORIES
# ============================================

DIRECTORIES = [
    STORAGE_DIR,
    USER_DIR,
    UPLOAD_DIR,
    PROCESSED_DIR,
    VECTOR_DIR,
]

for directory in DIRECTORIES:
    directory.mkdir(
        parents=True,
        exist_ok=True
    )
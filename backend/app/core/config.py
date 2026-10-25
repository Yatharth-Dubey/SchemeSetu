from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
APP_DIR = BASE_DIR / "app"
STORAGE_DIR = BASE_DIR / "storage"

DEFAULT_USER = "local_dev"


def get_user_storage_paths(user_id: str) -> dict[str, Path]:
    user_dir = STORAGE_DIR / "users" / str(user_id)

    paths = {
        "user_dir": user_dir,
        "upload_dir": user_dir / "uploads",
        "processed_dir": user_dir / "processed",
        "vector_dir": user_dir / "vectors",
    }

    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)

    return paths


# Existing local-development paths: preserve backward compatibility.
_default_paths = get_user_storage_paths(DEFAULT_USER)

USER_DIR = _default_paths["user_dir"]
UPLOAD_DIR = _default_paths["upload_dir"]
PROCESSED_DIR = _default_paths["processed_dir"]
VECTOR_DIR = _default_paths["vector_dir"]
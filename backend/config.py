import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR / "backend"
STORAGE_DIR = BASE_DIR / "storage"

MODELS_DIR = STORAGE_DIR / "models"
UPLOADS_DIR = STORAGE_DIR / "uploads"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
TEMP_DIR = STORAGE_DIR / "temp"
HISTORY_DIR = STORAGE_DIR / "history"
SAMPLES_DIR = STORAGE_DIR / "samples"

# Ensure runtime directories exist
for path in [MODELS_DIR, UPLOADS_DIR, OUTPUTS_DIR, TEMP_DIR, HISTORY_DIR, SAMPLES_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# API Server Settings
HOST = os.getenv("VISION_HOST", "0.0.0.0")
PORT = int(os.getenv("VISION_PORT", "8000"))
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
]

# Supported File Extensions (Comprehensive list decodable by FFmpeg / OpenCV)
ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif"
}

ALLOWED_VIDEO_EXTENSIONS = {
    ".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv",
    ".3gp", ".3g2", ".m4v", ".mpg", ".mpeg", ".ts", ".mts", ".m2ts", ".ogv"
}

# Max Upload Size
MAX_IMAGE_SIZE_MB = 50
MAX_VIDEO_SIZE_MB = 300

# Pretrained Model Checkpoint URLs & File Names
DDCOLOR_MODEL_FILENAME = "ddcolor_paper_tiny.pth"
DDCOLOR_MODEL_URL = "https://huggingface.co/piddnad/DDColor-models/resolve/main/ddcolor_paper_tiny.pth"
DDCOLOR_FALLBACK_URL = "https://github.com/piddnad/DDColor/releases/download/v0.1/ddcolor_paper_tiny.pth"

REALESRGAN_MODEL_FILENAME = "RealESRGAN_x4plus.pth"
REALESRGAN_MODEL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
REALESRGAN_FALLBACK_URL = "https://huggingface.co/ai-forever/Real-ESRGAN/resolve/main/RealESRGAN_x4plus.pth"

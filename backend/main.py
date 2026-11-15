import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import CORS_ORIGINS, STORAGE_DIR, HOST, PORT
from backend.core.device_manager import device_manager
from backend.models.model_manager import model_manager
from backend.utils.sample_generator import ensure_sample_media

# Import route modules
from backend.api.status_routes import router as status_router
from backend.api.image_routes import router as image_router
from backend.api.image_sr_routes import router as image_sr_router
from backend.api.smart_restore_routes import router as smart_restore_router
from backend.api.video_routes import router as video_router
from backend.api.history_routes import router as history_router
from backend.api.media_routes import router as media_router

app = FastAPI(
    title="VISION AI — Computer Vision Deep Learning API",
    description="High-performance backend API for DDColor colorization and Real-ESRGAN super-resolution.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(status_router, prefix="/api")
app.include_router(image_router, prefix="/api")
app.include_router(image_sr_router, prefix="/api")
app.include_router(smart_restore_router, prefix="/api")
app.include_router(video_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(media_router, prefix="/api")

# Static mount for storage directory
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")


@app.on_event("startup")
async def startup_event():
    print("[VISION AI] Backend startup initiated...")
    print(f"[VISION AI] Active compute device: {device_manager.get_device_name()}")
    try:
        ensure_sample_media()
    except Exception as e:
        print(f"[VISION AI] Warning: Sample media generation deferred: {e}")
    
    # Warm up neural models in background for zero-latency inference
    model_manager.preload_models_background()
    print("[VISION AI] Ready to process media inference requests.")


@app.on_event("shutdown")
async def shutdown_event():
    print("[VISION AI] Unloading models and freeing memory...")
    model_manager.unload_models()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=False)


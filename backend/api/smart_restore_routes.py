import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.config import UPLOADS_DIR, ALLOWED_IMAGE_EXTENSIONS
from backend.services.media_analysis_service import media_analysis_service
from backend.services.smart_restore_service import smart_restore_service

router = APIRouter(prefix="/smart-restore", tags=["Smart Restore Pipeline"])


@router.post("/analyze")
async def analyze_media_endpoint(
    image: UploadFile = File(...),
):
    """
    Analyzes an uploaded image's physical properties:
    - Grayscale vs natural polychromatic colors.
    - Laplacian blur and edge sharpness variance.
    - Contrast and dynamic range.
    - High-frequency residual noise.
    - Resolution classification.
    Returns transparent rule-based restoration recommendations.
    """
    file_ext = Path(image.filename).suffix.lower() if image.filename else ""
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {file_ext}. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    upload_id = str(uuid.uuid4())[:8]
    safe_name = image.filename.replace(" ", "_") if image.filename else f"image{file_ext}"
    input_path = UPLOADS_DIR / f"analyze_{upload_id}_{safe_name}"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        analysis = media_analysis_service.analyze_image(input_path)
        analysis["uploaded_filename"] = input_path.name
        analysis["original_image_url"] = f"/api/media/upload/{input_path.name}"
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Media analysis failed: {str(e)}")


@router.post("/execute")
async def execute_smart_restore_endpoint(
    image: UploadFile = File(...),
    mode: str = Form("quick"),  # 'quick' or 'advanced'
    enable_colorization: bool = Form(True),
    scale: int = Form(4),  # 0 (off), 2 or 4
    preferred_format: str = Form("png"),
):
    """
    Executes an intelligent multi-stage restoration pipeline combining DDColor and Real-ESRGAN.
    """
    file_ext = Path(image.filename).suffix.lower() if image.filename else ""
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {file_ext}. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    upload_id = str(uuid.uuid4())[:8]
    safe_name = image.filename.replace(" ", "_") if image.filename else f"image{file_ext}"
    input_path = UPLOADS_DIR / f"smart_{upload_id}_{safe_name}"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        result = smart_restore_service.execute_smart_restore(
            input_image_path=input_path,
            mode=mode,
            enable_colorization=enable_colorization,
            scale=scale,
            preferred_format=preferred_format,
        )
        result["original_image_url"] = f"/api/media/upload/{input_path.name}"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Smart restoration failed: {str(e)}")


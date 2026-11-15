import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.config import UPLOADS_DIR, ALLOWED_IMAGE_EXTENSIONS
from backend.services.image_service import image_service
from backend.services.history_service import history_service

router = APIRouter(prefix="/image", tags=["Image Colorization"])


@router.post("/colorize")
async def colorize_image_endpoint(
    image: UploadFile = File(...),
    reference: Optional[UploadFile] = File(None),
    preferred_format: str = Form("png"),
):
    """
    Colorize a grayscale image using the pretrained DDColor deep learning model.
    """
    # Validate extension
    file_ext = Path(image.filename).suffix.lower()
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {file_ext}. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    # Save uploaded input image
    upload_id = str(uuid.uuid4())[:8]
    input_path = UPLOADS_DIR / f"upload_{upload_id}_{image.filename}"
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Handle optional reference image
    ref_path = None
    if reference and reference.filename:
        ref_ext = Path(reference.filename).suffix.lower()
        if ref_ext in ALLOWED_IMAGE_EXTENSIONS:
            ref_path = UPLOADS_DIR / f"ref_{upload_id}_{reference.filename}"
            with open(ref_path, "wb") as buffer:
                shutil.copyfileobj(reference.file, buffer)

    try:
        result = image_service.colorize_image(
            input_image_path=input_path,
            reference_image_path=ref_path,
            preferred_format=preferred_format,
        )

        # Record run in history
        history_service.add_record(
            record_id=result["job_id"],
            file_name=image.filename,
            module="Image Colorization",
            model_name=result["model_name"],
            input_resolution=result["input_resolution"],
            output_resolution=result["output_resolution"],
            device=result["device"],
            duration_sec=result["elapsed_seconds"],
            status="completed",
            output_url=result["png_url"] if preferred_format == "png" else result["jpg_url"],
            download_url=f"/api/media/download/{result['png_filename'] if preferred_format == 'png' else result['jpg_filename']}",
            metrics=result["metrics"],
        )

        result["original_image_url"] = f"/api/media/upload/{input_path.name}"
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image colorization failed: {str(e)}")


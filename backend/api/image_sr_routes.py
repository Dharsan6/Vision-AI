import uuid
import shutil
from pathlib import Path
import cv2
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.config import UPLOADS_DIR, ALLOWED_IMAGE_EXTENSIONS
from backend.core.device_manager import device_manager
from backend.core.job_manager import job_manager
from backend.services.image_super_resolution_service import image_super_resolution_service
from backend.services.history_service import history_service

router = APIRouter(prefix="/image", tags=["Image Super-Resolution"])


@router.post("/enhance")
async def enhance_image_endpoint(
    image: UploadFile = File(...),
    scale: int = Form(4),
    strength: str = Form("strong"),
    preferred_format: str = Form("png"),
    max_dimension: int = Form(0),
    sync: bool = Form(False),
):
    """
    Super-resolve a single image using the Real-ESRGAN x4plus deep learning model (2x or 4x).
    Supports 'strong' (100% deep neural reconstruction) and 'balanced' (natural texture blending).
    By default runs asynchronously via JobManager, returning immediately with a job_id for live progress polling.
    Supports synchronous execution when sync=True.
    """
    file_ext = Path(image.filename).suffix.lower() if image.filename else ""
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {file_ext}. Allowed: {sorted(list(ALLOWED_IMAGE_EXTENSIONS))}",
        )

    if scale not in (2, 4):
        raise HTTPException(status_code=400, detail="Scale factor must be 2 or 4.")

    if strength not in ("balanced", "strong"):
        strength = "strong"

    upload_id = str(uuid.uuid4())[:12]
    safe_name = image.filename.replace(" ", "_") if image.filename else f"image{file_ext}"
    input_path = UPLOADS_DIR / f"upload_sr_{upload_id}_{safe_name}"

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Validate image decoding and extract dimensions
    probe = cv2.imread(str(input_path))
    if probe is None:
        input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Could not decode uploaded image.")
    orig_h, orig_w = probe.shape[:2]
    file_size_mb = round(input_path.stat().st_size / (1024 * 1024), 2)
    del probe

    if sync:
        # Synchronous execution mode (for direct scripts and Smart Restore)
        try:
            result = image_super_resolution_service.upscale_image(
                input_image_path=input_path,
                scale=scale,
                strength=strength,
                preferred_format=preferred_format,
                original_filename=image.filename or safe_name,
                max_dimension=max_dimension if max_dimension > 0 else None,
            )

            # Record in history database
            history_service.add_record(
                record_id=result["job_id"],
                file_name=image.filename or safe_name,
                module=f"Image Super-Resolution ({scale}x)",
                model_name=result["model_name"],
                input_resolution=result["input_resolution"],
                output_resolution=result["output_resolution"],
                device=result["device"],
                duration_sec=result["elapsed_seconds"],
                status="completed",
                output_url=result["output_url"],
                download_url=result["download_url"],
                metrics=result["metrics"],
            )

            result["original_image_url"] = f"/api/media/upload/{input_path.name}"
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image super-resolution failed: {str(e)}")

    # Asynchronous background job mode (default for web client)
    job_id = upload_id
    job = job_manager.create_job(
        job_id=job_id,
        module=f"Image Super-Resolution ({scale}x)",
        filename=image.filename or safe_name,
    )
    job["original_image_url"] = f"/api/media/upload/{input_path.name}"
    job["input_resolution"] = f"{orig_w}x{orig_h}"
    job["file_size_mb"] = file_size_mb
    job["scale"] = f"{scale}x"
    job["strength"] = strength
    job["device"] = device_manager.get_device_name()

    # Launch processing in background thread
    job_manager.run_in_background(
        image_super_resolution_service.process_image_job,
        job_id=job_id,
        input_image_path=input_path,
        scale=scale,
        strength=strength,
        preferred_format=preferred_format,
        original_filename=image.filename or safe_name,
        max_dimension=max_dimension if max_dimension > 0 else None,
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
        "scale": f"{scale}x",
        "strength": strength,
        "message": f"Image super-resolution ({scale}x, {strength}) job queued for background execution.",
        "original_image_url": f"/api/media/upload/{input_path.name}",
        "input_resolution": f"{orig_w}x{orig_h}",
        "file_size_mb": file_size_mb,
        "device": device_manager.get_device_name(),
    }


@router.get("/enhance/result/{job_id}")
def get_image_job_result_endpoint(job_id: str):
    """
    Dedicated endpoint to fetch completed image super-resolution job results.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=f"Job failed: {job.get('error')}")
    if job["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Job was cancelled by user.")
    if job["status"] != "completed":
        return {
            "completed": False,
            "status": job["status"],
            "progress": job["progress"],
            "current_step": job["current_step"],
        }
    return {
        "completed": True,
        "status": "completed",
        "result": job.get("result"),
    }



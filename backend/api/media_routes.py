import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.config import UPLOADS_DIR, OUTPUTS_DIR, SAMPLES_DIR

router = APIRouter(prefix="/media", tags=["Media Serving & Downloads"])


@router.get("/upload/{filename}")
def get_uploaded_media(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return FileResponse(file_path)


@router.get("/output/{filename}")
def get_output_media(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    return FileResponse(file_path)


@router.get("/download/{filename}")
def download_output_media(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=filename,
    )


@router.get("/sample/{filename}")
def get_sample_media(filename: str):
    file_path = SAMPLES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample media not found")
    return FileResponse(file_path)


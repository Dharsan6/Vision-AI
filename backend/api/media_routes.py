import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from backend.config import UPLOADS_DIR, OUTPUTS_DIR, SAMPLES_DIR

router = APIRouter(prefix="/media", tags=["Media Serving & Downloads"])


@router.api_route("/upload/{filename}", methods=["GET", "HEAD"])
def get_uploaded_media(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return FileResponse(file_path)


@router.api_route("/output/{filename}", methods=["GET", "HEAD"])
def get_output_media(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    return FileResponse(file_path)


@router.api_route("/download/{filename}", methods=["GET", "HEAD"])
def download_output_media(filename: str, name: Optional[str] = Query(None)):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    # Use custom clean download filename if provided, otherwise default to filename
    download_filename = name.strip() if name and name.strip() else filename
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=download_filename,
    )


@router.api_route("/sample/{filename}", methods=["GET", "HEAD"])
def get_sample_media(filename: str):
    file_path = SAMPLES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample media not found")
    return FileResponse(file_path)


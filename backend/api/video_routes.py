import uuid
import shutil
import json
import subprocess
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.config import UPLOADS_DIR, ALLOWED_VIDEO_EXTENSIONS
from backend.core.job_manager import job_manager
from backend.services.video_colorization_service import video_colorization_service
from backend.services.super_resolution_service import super_resolution_service

router = APIRouter(tags=["Video Processing"])


def _probe_video_streams(file_path: Path) -> dict:
    """
    Use FFprobe to inspect actual video/audio streams.
    Returns dict with has_video, has_audio, codec_name or raises ValueError
    if the file has no decodable video stream.
    """
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        str(file_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=30)
    if result.returncode != 0:
        raise ValueError(
            f"FFprobe could not read the file (may be corrupted or unsupported codec). "
            f"FFprobe stderr: {result.stderr.strip()[:300]}"
        )
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        raise ValueError("FFprobe returned invalid output — file may be corrupted.")

    streams = data.get("streams", [])
    video_streams = [s for s in streams if s.get("codec_type") == "video"]
    audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

    if not video_streams:
        raise ValueError(
            "No decodable video stream found. "
            "File may be audio-only, corrupted, or encoded with an unsupported codec."
        )

    return {
        "has_video": True,
        "has_audio": len(audio_streams) > 0,
        "video_codec": video_streams[0].get("codec_name", "unknown"),
        "audio_codec": audio_streams[0].get("codec_name", "") if audio_streams else "",
    }


def _validate_video_upload(video: UploadFile, temp_path: Path) -> dict:
    """
    Validates an uploaded video file.
    1. Checks file extension against ALLOWED_VIDEO_EXTENSIONS.
       If extension is unknown/missing, still allows it to pass to FFprobe.
    2. Uses FFprobe to confirm at least one decodable video stream.
    Returns probe info dict on success, raises HTTPException on failure.
    """
    file_ext = Path(video.filename).suffix.lower() if video.filename else ""

    # Allow blank extension files (may come from browser as application/octet-stream)
    # but reject files with a known bad extension that is explicitly disallowed
    KNOWN_NON_VIDEO_EXTENSIONS = {
        ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".zip", ".tar", ".gz", ".jpg", ".jpeg", ".png",
        ".gif", ".bmp", ".svg", ".mp3", ".wav", ".aac", ".flac",
    }
    if file_ext and file_ext not in ALLOWED_VIDEO_EXTENSIONS and file_ext in KNOWN_NON_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File extension '{file_ext}' is not a video format. "
                f"Supported containers: {sorted(ALLOWED_VIDEO_EXTENSIONS)}"
            ),
        )

    # FFprobe-based validation on the saved temp file
    try:
        probe_info = _probe_video_streams(temp_path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return probe_info


@router.post("/video/colorize")
async def colorize_video_endpoint(
    video: UploadFile = File(...),
    resolution: str = Form("original"),  # original, 720p, 480p
    stabilization: bool = Form(True),
    max_frames: int = Form(0),  # 0 = entire video
):
    """
    Submits a video for deep learning colorization via DDColor and scene-cut stabilization.
    Returns immediately with a job_id for background progress tracking.
    """
    job_id = str(uuid.uuid4())[:12]
    # Use original filename extension for saving; fall back to .mp4 if no extension
    file_ext = Path(video.filename).suffix.lower() if video.filename else ".mp4"
    safe_name = video.filename.replace(" ", "_") if video.filename else f"video{file_ext}"
    input_video_path = UPLOADS_DIR / f"vid_{job_id}_{safe_name}"

    # Save uploaded file first (needed for FFprobe validation)
    with open(input_video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    # Validate using FFprobe (content-based, not extension-based)
    try:
        _validate_video_upload(video, input_video_path)
    except HTTPException:
        input_video_path.unlink(missing_ok=True)
        raise

    # Initialize job in manager
    job = job_manager.create_job(job_id, module="Video Colorization", filename=video.filename)
    job["original_video_url"] = f"/api/media/upload/{input_video_path.name}"

    # Launch processing in background thread
    job_manager.run_in_background(
        video_colorization_service.process_video_job,
        job_id=job_id,
        input_video_path=input_video_path,
        target_resolution=resolution,
        enable_stabilization=stabilization,
        max_frames=max_frames,
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
        "message": "Video colorization job queued for background execution.",
        "original_video_url": f"/api/media/upload/{input_video_path.name}",
    }


@router.post("/video/enhance")
async def enhance_video_endpoint(
    video: UploadFile = File(...),
    scale: int = Form(4),  # 2 or 4
    max_frames: int = Form(0),
):
    """
    Submits a video for deep learning super-resolution via Real-ESRGAN x4plus.
    Returns immediately with a job_id for background progress tracking.
    """
    if scale not in (2, 4):
        raise HTTPException(status_code=400, detail="Scale factor must be 2 or 4.")

    job_id = str(uuid.uuid4())[:12]
    file_ext = Path(video.filename).suffix.lower() if video.filename else ".mp4"
    safe_name = video.filename.replace(" ", "_") if video.filename else f"video{file_ext}"
    input_video_path = UPLOADS_DIR / f"vid_sr_{job_id}_{safe_name}"

    # Save uploaded file first (needed for FFprobe validation)
    with open(input_video_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    # Validate using FFprobe (content-based, not extension-based)
    try:
        _validate_video_upload(video, input_video_path)
    except HTTPException:
        input_video_path.unlink(missing_ok=True)
        raise

    # Initialize job in manager
    job = job_manager.create_job(job_id, module="Video Super-Resolution", filename=video.filename)
    job["original_video_url"] = f"/api/media/upload/{input_video_path.name}"

    # Launch processing in background thread
    job_manager.run_in_background(
        super_resolution_service.process_video_job,
        job_id=job_id,
        input_video_path=input_video_path,
        scale=scale,
        max_frames=max_frames,
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "queued",
        "scale": f"{scale}x",
        "message": f"Video super-resolution ({scale}x) job queued for background execution.",
        "original_video_url": f"/api/media/upload/{input_video_path.name}",
    }


@router.get("/jobs/{job_id}")
def get_job_status_endpoint(job_id: str):
    """
    Polls real-time progress, frame counters, and step details for a background job.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    return job


@router.get("/jobs/{job_id}/result")
def get_job_result_endpoint(job_id: str):
    """
    Retrieves the final result and output paths of a completed job.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    if job["status"] == "failed":
        raise HTTPException(status_code=500, detail=f"Job failed: {job.get('error')}")
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


@router.post("/jobs/{job_id}/cancel")
def cancel_job_endpoint(job_id: str):
    """
    Cancels an active background job.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")
    cancelled = job_manager.cancel_job(job_id)
    return {
        "success": cancelled,
        "job_id": job_id,
        "status": job.get("status"),
        "message": "Job cancellation requested." if cancelled else "Job could not be cancelled or is already finished.",
    }


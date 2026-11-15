import cv2
import numpy as np
from typing import Dict, Any, Optional
from skimage.metrics import peak_signal_noise_ratio as psnr_fn
from skimage.metrics import structural_similarity as ssim_fn


def compute_image_metrics(
    processed_bgr: np.ndarray,
    reference_bgr: Optional[np.ndarray] = None,
) -> Dict[str, Any]:
    """
    Computes objective image quality metrics if reference ground truth is available.
    Returns: Dict containing PSNR, SSIM, and resolution details.
    """
    h, w, c = processed_bgr.shape

    if reference_bgr is None:
        return {
            "has_reference": False,
            "psnr": None,
            "ssim": None,
            "resolution": f"{w}x{h}",
            "note": "Reference image unavailable (metrics require ground-truth comparison).",
        }

    # Resize reference if necessary for fair metric computation
    ref = reference_bgr
    if ref.shape[:2] != (h, w):
        ref = cv2.resize(ref, (w, h), interpolation=cv2.INTER_AREA)

    # Convert to RGB float in [0, 1]
    proc_rgb = cv2.cvtColor(processed_bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    ref_rgb = cv2.cvtColor(ref, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0

    calculated_psnr = float(psnr_fn(ref_rgb, proc_rgb, data_range=1.0))
    calculated_ssim = float(ssim_fn(ref_rgb, proc_rgb, channel_axis=2, data_range=1.0))

    return {
        "has_reference": True,
        "psnr": round(calculated_psnr, 2),
        "ssim": round(calculated_ssim, 4),
        "resolution": f"{w}x{h}",
        "note": "Measured against provided ground-truth reference image.",
    }


def compute_video_metrics(
    frame_count: int,
    elapsed_time_seconds: float,
    input_resolution: str,
    output_resolution: str,
    output_file_size_bytes: int,
) -> Dict[str, Any]:
    """
    Computes real video processing operational benchmarks.
    """
    avg_frame_time = (
        round(elapsed_time_seconds / frame_count, 3) if frame_count > 0 else 0.0
    )
    processing_fps = (
        round(frame_count / elapsed_time_seconds, 2) if elapsed_time_seconds > 0 else 0.0
    )
    size_mb = round(output_file_size_bytes / (1024 * 1024), 2)

    return {
        "frame_count": frame_count,
        "elapsed_seconds": round(elapsed_time_seconds, 2),
        "average_frame_time_sec": avg_frame_time,
        "processing_throughput_fps": processing_fps,
        "input_resolution": input_resolution,
        "output_resolution": output_resolution,
        "output_size_mb": size_mb,
    }


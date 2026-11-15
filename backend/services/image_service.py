import time
import uuid
import cv2
from pathlib import Path
from typing import Dict, Any, Optional

from backend.config import OUTPUTS_DIR
from backend.core.device_manager import device_manager
from backend.models.model_manager import model_manager
from backend.utils.metrics import compute_image_metrics


class ImageService:
    """
    Service for single-image deep learning colorization using DDColor.
    """

    @staticmethod
    def colorize_image(
        input_image_path: Path,
        reference_image_path: Optional[Path] = None,
        preferred_format: str = "png",
        input_size: int = 512,
    ) -> Dict[str, Any]:
        """
        Executes DDColor image colorization.
        - Preserves original image dimensions.
        - Measures actual processing duration and hardware device.
        - Saves both PNG and JPEG formats for flexible user downloads.
        """
        if not input_image_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_image_path}")

        # Read image
        img_bgr = cv2.imread(str(input_image_path))
        if img_bgr is None:
            raise ValueError(f"Could not decode image at {input_image_path}")

        orig_h, orig_w = img_bgr.shape[:2]

        # Read optional reference image for ground-truth comparison
        ref_bgr = None
        if reference_image_path and reference_image_path.exists():
            ref_bgr = cv2.imread(str(reference_image_path))

        # Retrieve predictor and record device
        predictor = model_manager.get_ddcolor(input_size=input_size)
        device_name = device_manager.get_device_name()

        start_time = time.perf_counter()
        colorized_bgr = predictor.colorize(img_bgr)
        elapsed_time = round(time.perf_counter() - start_time, 3)

        # Generate unique output filenames
        job_id = str(uuid.uuid4())[:12]
        base_name = f"colorized_{job_id}_{input_image_path.stem}"
        png_filename = f"{base_name}.png"
        jpg_filename = f"{base_name}.jpg"

        png_path = OUTPUTS_DIR / png_filename
        jpg_path = OUTPUTS_DIR / jpg_filename

        # Save both PNG (lossless) and JPG (compact)
        ok1 = cv2.imwrite(str(png_path), colorized_bgr)
        ok2 = cv2.imwrite(str(jpg_path), colorized_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

        if not ok1 or not png_path.exists() or png_path.stat().st_size == 0:
            raise IOError(f"Colorized PNG output could not be saved at {png_path}")
        if not ok2 or not jpg_path.exists() or jpg_path.stat().st_size == 0:
            raise IOError(f"Colorized JPG output could not be saved at {jpg_path}")

        # Compute metrics
        metrics = compute_image_metrics(colorized_bgr, ref_bgr)

        active_filename = png_filename if preferred_format == "png" else jpg_filename
        active_url = f"/api/media/output/{active_filename}"

        return {
            "success": True,
            "job_id": job_id,
            "module": "Image Colorization",
            "model_name": "DDColor (ConvNeXt-Tiny + Dual Decoder)",
            "device": device_name,
            "input_resolution": f"{orig_w}x{orig_h}",
            "output_resolution": f"{colorized_bgr.shape[1]}x{colorized_bgr.shape[0]}",
            "elapsed_seconds": elapsed_time,
            "png_filename": png_filename,
            "jpg_filename": jpg_filename,
            "png_url": f"/api/media/output/{png_filename}",
            "jpg_url": f"/api/media/output/{jpg_filename}",
            "output_url": active_url,
            "download_url": f"/api/media/download/{active_filename}",
            "metrics": metrics,
        }


image_service = ImageService()


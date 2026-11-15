import math
import time
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, Callable

import cv2
import numpy as np

from backend.config import OUTPUTS_DIR
from backend.core.device_manager import device_manager
from backend.core.job_manager import job_manager
from backend.models.model_manager import model_manager
from backend.services.history_service import history_service


class ImageSuperResolutionService:
    """
    Service for single-image deep learning super-resolution using Real-ESRGAN x4plus.
    Supports 2x and 4x scaling with streaming tiled inference for memory efficiency.
    Supports both direct synchronous calls and asynchronous background jobs with real-time polling.
    """

    @staticmethod
    def upscale_image(
        input_image_path: Path,
        scale: int = 4,
        preferred_format: str = "png",
        max_dimension: Optional[int] = None,
        on_tile_done: Optional[Callable[[int, int], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> Dict[str, Any]:
        """
        Executes Real-ESRGAN image super-resolution.
        - Supports 2x (AI-guided downsample from native 4x) and 4x deep upscaling.
        - Employs 512x512 streaming tiled processing to preserve Apple Silicon unified memory.
        - Saves both lossless PNG and compact JPG files for user convenience.
        """
        if not input_image_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_image_path}")

        if scale not in (2, 4):
            raise ValueError(f"Invalid scale factor: {scale}. Must be 2 or 4.")

        # Read input image
        img_bgr = cv2.imread(str(input_image_path))
        if img_bgr is None:
            raise ValueError(f"Could not decode image at {input_image_path}")

        raw_h, raw_w = img_bgr.shape[:2]

        # Optional user-specified maximum processing resolution limit
        if max_dimension and max_dimension > 0 and max(raw_h, raw_w) > max_dimension:
            if raw_w >= raw_h:
                new_w = max_dimension
                new_h = int(round(raw_h * (max_dimension / raw_w)))
            else:
                new_h = max_dimension
                new_w = int(round(raw_w * (max_dimension / raw_h)))
            img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

        orig_h, orig_w = img_bgr.shape[:2]
        input_file_size_bytes = input_image_path.stat().st_size

        # Retrieve predictor and record device
        predictor = model_manager.get_realesrgan(scale=4, tile_size=512)
        device_name = device_manager.get_device_name()

        start_time = time.perf_counter()
        enhanced_bgr = predictor.enhance(
            img_bgr,
            outscale=scale,
            on_tile_done=on_tile_done,
            cancel_check=cancel_check,
        )
        elapsed_time = round(time.perf_counter() - start_time, 3)

        out_h, out_w = enhanced_bgr.shape[:2]

        # Generate unique output filenames
        job_id = str(uuid.uuid4())[:12]
        base_name = f"sr_{scale}x_{job_id}_{input_image_path.stem}"
        png_filename = f"{base_name}.png"
        jpg_filename = f"{base_name}.jpg"

        png_path = OUTPUTS_DIR / png_filename
        jpg_path = OUTPUTS_DIR / jpg_filename

        # Save both PNG (lossless) and JPG (high quality)
        cv2.imwrite(str(png_path), enhanced_bgr)
        cv2.imwrite(str(jpg_path), enhanced_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

        out_file_size_bytes = png_path.stat().st_size

        # Telemetry metrics
        metrics = {
            "scale_factor": f"{scale}x",
            "input_resolution": f"{orig_w}x{orig_h}",
            "output_resolution": f"{out_w}x{out_h}",
            "pixel_count_increase": f"{round((out_w * out_h) / (orig_w * orig_h), 1)}x",
            "input_size_mb": round(input_file_size_bytes / (1024 * 1024), 2),
            "output_size_mb": round(out_file_size_bytes / (1024 * 1024), 2),
            "inference_time_sec": elapsed_time,
            "architecture": "RRDBNet (Residual in Residual Dense Block)",
            "upscaling_method": (
                "Native 4x RRDBNet deep upscaling"
                if scale == 4
                else "Native 4x RRDBNet feature extraction with area-sampled 2x downsampling"
            ),
        }

        # Memory cleanup
        device_manager.cleanup_memory()

        return {
            "success": True,
            "job_id": job_id,
            "module": "Image Super-Resolution",
            "model_name": "Real-ESRGAN x4plus (RRDBNet Deep Architecture)",
            "device": device_name,
            "scale_factor": f"{scale}x",
            "input_resolution": f"{orig_w}x{orig_h}",
            "output_resolution": f"{out_w}x{out_h}",
            "elapsed_seconds": elapsed_time,
            "png_filename": png_filename,
            "jpg_filename": jpg_filename,
            "png_url": f"/api/media/output/{png_filename}",
            "jpg_url": f"/api/media/output/{jpg_filename}",
            "download_url": f"/api/media/download/{png_filename if preferred_format == 'png' else jpg_filename}",
            "metrics": metrics,
        }

    def process_image_job(
        self,
        job_id: str,
        input_image_path: Path,
        scale: int = 4,
        preferred_format: str = "png",
        original_filename: str = "",
        max_dimension: Optional[int] = None,
    ):
        """
        Background worker that processes an image super-resolution job with real-time progress.
        """
        try:
            job_manager.update_job(
                job_id,
                status="processing",
                progress=2.0,
                current_step="Inspecting source image and dimensions...",
            )

            # Probe image to determine tile requirements
            probe = cv2.imread(str(input_image_path))
            if probe is None:
                raise ValueError("Could not decode image file.")

            raw_h, raw_w = probe.shape[:2]
            if max_dimension and max_dimension > 0 and max(raw_h, raw_w) > max_dimension:
                if raw_w >= raw_h:
                    eff_w = max_dimension
                    eff_h = int(round(raw_h * (max_dimension / raw_w)))
                else:
                    eff_h = max_dimension
                    eff_w = int(round(raw_w * (max_dimension / raw_h)))
            else:
                eff_w, eff_h = raw_w, raw_h

            tiles_x = math.ceil(eff_w / 512)
            tiles_y = math.ceil(eff_h / 512)
            total_tiles = tiles_x * tiles_y
            del probe

            job_manager.update_job(
                job_id,
                progress=5.0,
                total_frames=total_tiles,
                current_step=f"Initializing Real-ESRGAN x4plus ({total_tiles} neural tiles)...",
            )

            def on_tile_progress(cur_tile: int, tot_tiles: int):
                pct = 5.0 + (cur_tile / tot_tiles) * 85.0
                step_msg = f"Processing neural tile {cur_tile} of {tot_tiles} ({round(cur_tile / tot_tiles * 100)}%)"
                job_manager.update_job(
                    job_id,
                    progress=pct,
                    current_frame=cur_tile,
                    total_frames=tot_tiles,
                    current_step=step_msg,
                )

            # Execute upscaling
            result = self.upscale_image(
                input_image_path=input_image_path,
                scale=scale,
                preferred_format=preferred_format,
                max_dimension=max_dimension,
                on_tile_done=on_tile_progress,
                cancel_check=lambda: job_manager.is_cancelled(job_id),
            )

            # Step: Encoding & Saving
            job_manager.update_job(
                job_id,
                progress=95.0,
                current_step="Encoding high-resolution output formats...",
            )

            # Add to history database
            history_service.add_record(
                record_id=job_id,
                file_name=original_filename or input_image_path.name,
                module=f"Image Super-Resolution ({scale}x)",
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

            result["original_image_url"] = f"/api/media/upload/{input_image_path.name}"

            job_manager.update_job(
                job_id,
                status="completed",
                progress=100.0,
                current_step="Image enhancement completed successfully.",
                result=result,
            )

        except InterruptedError:
            print(f"[ImageSuperResolution] Job {job_id} cancelled by user.")
            job_manager.update_job(
                job_id,
                status="cancelled",
                current_step="Job cancelled by user.",
            )
        except Exception as e:
            print(f"[ImageSuperResolution] Job {job_id} failed: {e}")
            job_manager.update_job(
                job_id,
                status="failed",
                error=str(e),
                current_step=f"Failed: {str(e)}",
            )
        finally:
            device_manager.cleanup_memory()


image_super_resolution_service = ImageSuperResolutionService()



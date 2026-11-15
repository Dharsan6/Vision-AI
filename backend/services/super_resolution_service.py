import shutil
import time
from pathlib import Path
from typing import Dict, Any, Optional

import cv2
import numpy as np

from backend.config import TEMP_DIR, OUTPUTS_DIR
from backend.core.device_manager import device_manager
from backend.core.frame_extractor import VideoFrameExtractor
from backend.core.job_manager import job_manager
from backend.core.video_reconstructor import VideoReconstructor
from backend.models.model_manager import model_manager
from backend.services.history_service import history_service
from backend.utils.metrics import compute_video_metrics


class SuperResolutionService:
    """
    End-to-end video super-resolution pipeline using Real-ESRGAN x4plus (2x/4x scaling),
    tiled frame inference, audio preservation, and H.264 reconstruction.
    """

    def process_video_job(
        self,
        job_id: str,
        input_video_path: Path,
        scale: int = 4,
        max_frames: int = 0,
    ):
        temp_job_dir = TEMP_DIR / f"vsuper_{job_id}"
        input_frames_dir = temp_job_dir / "input_frames"
        output_frames_dir = temp_job_dir / "enhanced_frames"

        try:
            job_manager.update_job(
                job_id,
                status="processing",
                progress=5.0,
                current_step="Extracting video frames and inspecting stream metadata...",
            )

            # Step 1: Extract frames
            total_frames, meta = VideoFrameExtractor.extract_frames_to_dir(
                input_video_path,
                input_frames_dir,
                target_resolution="original",
                max_frames=max_frames,
            )

            if total_frames == 0:
                raise ValueError("No frames could be extracted from video")

            job_manager.update_job(
                job_id,
                total_frames=total_frames,
                progress=12.0,
                current_step=f"Loaded {total_frames} frames. Loading Real-ESRGAN x4plus model...",
            )

            # Step 2: Initialize Real-ESRGAN model
            predictor = model_manager.get_realesrgan(scale=4, tile_size=512)
            device_name = device_manager.get_device_name()

            output_frames_dir.mkdir(parents=True, exist_ok=True)
            start_infer_time = time.perf_counter()

            # Target dimensions
            out_w = meta["width"] * scale
            out_h = meta["height"] * scale

            # Step 3: Sequential frame super-resolution
            for idx in range(total_frames):
                frame_in_path = input_frames_dir / f"frame_{idx:06d}.png"
                frame_bgr = cv2.imread(str(frame_in_path))

                # Real-ESRGAN inference with scaling factor
                enhanced_bgr = predictor.enhance(frame_bgr, outscale=scale)

                # Ensure dimensions are even for H.264 encoding compatibility
                cur_h, cur_w = enhanced_bgr.shape[:2]
                if cur_w % 2 != 0 or cur_h % 2 != 0:
                    cur_w = (cur_w // 2) * 2
                    cur_h = (cur_h // 2) * 2
                    enhanced_bgr = cv2.resize(enhanced_bgr, (cur_w, cur_h), interpolation=cv2.INTER_AREA)

                out_w, out_h = cur_w, cur_h

                frame_out_path = output_frames_dir / f"frame_{idx:06d}.png"
                cv2.imwrite(str(frame_out_path), enhanced_bgr)

                # Memory cleanup periodically
                if idx % 5 == 0:
                    device_manager.cleanup_memory()

                # Update progress: 12% to 88% range for super-resolution
                pct = 12.0 + (idx + 1) / total_frames * 76.0
                job_manager.update_job(
                    job_id,
                    current_frame=idx + 1,
                    progress=pct,
                    current_step=f"Upscaling frame {idx + 1}/{total_frames} ({round(pct, 1)}%)",
                )

            infer_elapsed = time.perf_counter() - start_infer_time

            # Step 4: Reconstruct video using FFmpeg
            job_manager.update_job(
                job_id,
                progress=90.0,
                current_step="Reconstructing enhanced high-definition MP4 video...",
            )

            out_filename = f"enhanced_{scale}x_{job_id}_{input_video_path.stem}.mp4"
            final_output_path = OUTPUTS_DIR / out_filename

            VideoReconstructor.reconstruct(
                frames_pattern=str(output_frames_dir / "frame_%06d.png"),
                fps=meta["fps"],
                output_video_path=final_output_path,
                source_video_with_audio=input_video_path if meta["has_audio"] else None,
            )

            # Step 5: Metrics and Record
            total_elapsed = round(time.perf_counter() - start_infer_time, 2)
            out_size_bytes = final_output_path.stat().st_size
            metrics = compute_video_metrics(
                frame_count=total_frames,
                elapsed_time_seconds=total_elapsed,
                input_resolution=f"{meta['width']}x{meta['height']}",
                output_resolution=f"{out_w}x{out_h}",
                output_file_size_bytes=out_size_bytes,
            )

            result_data = {
                "job_id": job_id,
                "module": "Video Super-Resolution",
                "model_name": "Real-ESRGAN x4plus (RRDBNet Deep Architecture)",
                "device": device_name,
                "input_resolution": f"{meta['width']}x{meta['height']}",
                "output_resolution": f"{out_w}x{out_h}",
                "scale_factor": f"{scale}x",
                "fps": meta["fps"],
                "duration_seconds": meta["duration"],
                "has_audio": meta["has_audio"],
                "output_filename": out_filename,
                "output_url": f"/api/media/output/{out_filename}",
                "download_url": f"/api/media/download/{out_filename}",
                "metrics": metrics,
            }

            # Persist to history
            history_service.add_record(
                record_id=job_id,
                file_name=input_video_path.name,
                module=f"Video Super-Resolution ({scale}x)",
                model_name="Real-ESRGAN x4plus",
                input_resolution=f"{meta['width']}x{meta['height']}",
                output_resolution=f"{out_w}x{out_h}",
                device=device_name,
                duration_sec=total_elapsed,
                status="completed",
                output_url=result_data["output_url"],
                download_url=result_data["download_url"],
                metrics=metrics,
            )

            job_manager.update_job(
                job_id,
                status="completed",
                progress=100.0,
                current_step="Video enhancement completed successfully!",
                result=result_data,
            )

        except Exception as e:
            job_manager.update_job(
                job_id,
                status="failed",
                error=str(e),
                current_step=f"Super-resolution failed: {str(e)}",
            )
        finally:
            if temp_job_dir.exists():
                shutil.rmtree(temp_job_dir, ignore_errors=True)
            device_manager.cleanup_memory()


super_resolution_service = SuperResolutionService()


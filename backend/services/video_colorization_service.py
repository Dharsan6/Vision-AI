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
from backend.core.temporal_stabilizer import TemporalStabilizer
from backend.core.video_reconstructor import VideoReconstructor
from backend.models.model_manager import model_manager
from backend.services.history_service import history_service
from backend.utils.metrics import compute_video_metrics


class VideoColorizationService:
    """
    End-to-end video colorization pipeline using DDColor,
    scene cut detection, temporal stabilization, and FFmpeg reconstruction.
    """

    def process_video_job(
        self,
        job_id: str,
        input_video_path: Path,
        target_resolution: str = "original",
        enable_stabilization: bool = True,
        max_frames: int = 0,
    ):
        temp_job_dir = TEMP_DIR / f"vcolor_{job_id}"
        input_frames_dir = temp_job_dir / "input_frames"
        output_frames_dir = temp_job_dir / "color_frames"

        try:
            job_manager.update_job(
                job_id,
                status="processing",
                progress=5.0,
                current_step="Extracting frames and analyzing video metadata",
            )

            # Step 1: Extract frames & metadata
            total_frames, meta = VideoFrameExtractor.extract_frames_to_dir(
                input_video_path,
                input_frames_dir,
                target_resolution=target_resolution,
                max_frames=max_frames,
            )

            if total_frames == 0:
                raise ValueError("No frames could be extracted from video")

            job_manager.update_job(
                job_id,
                total_frames=total_frames,
                progress=15.0,
                current_step=f"Loaded {total_frames} frames. Initializing DDColor deep learning model...",
            )

            # Step 2: Initialize model and stabilizer
            predictor = model_manager.get_ddcolor(input_size=512)
            device_name = device_manager.get_device_name()
            stabilizer = TemporalStabilizer(smooth_alpha=0.82) if enable_stabilization else None

            output_frames_dir.mkdir(parents=True, exist_ok=True)
            start_infer_time = time.perf_counter()

            # Step 3: Sequential frame inference
            for idx in range(total_frames):
                frame_in_path = input_frames_dir / f"frame_{idx:06d}.png"
                frame_bgr = cv2.imread(str(frame_in_path))

                # DDColor inference
                color_bgr = predictor.colorize(frame_bgr)

                # Optional temporal stabilization
                if stabilizer:
                    color_bgr, is_cut = stabilizer.process_frame(color_bgr)

                frame_out_path = output_frames_dir / f"frame_{idx:06d}.png"
                cv2.imwrite(str(frame_out_path), color_bgr)

                # Update progress: 15% to 85% range for frame inference
                pct = 15.0 + (idx + 1) / total_frames * 70.0
                job_manager.update_job(
                    job_id,
                    current_frame=idx + 1,
                    progress=pct,
                    current_step=f"Colorizing frame {idx + 1}/{total_frames} ({round(pct, 1)}%)",
                )

            infer_elapsed = time.perf_counter() - start_infer_time

            # Step 4: Reconstruct video using FFmpeg
            job_manager.update_job(
                job_id,
                progress=88.0,
                current_step="Reconstructing H.264 video and re-muxing original audio...",
            )

            out_filename = f"colorized_{job_id}_{input_video_path.stem}.mp4"
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
                output_resolution=f"{meta['processed_width']}x{meta['processed_height']}",
                output_file_size_bytes=out_size_bytes,
            )

            result_data = {
                "job_id": job_id,
                "module": "Video Colorization",
                "model_name": "DDColor (Frame-wise Deep Learning)",
                "device": device_name,
                "input_resolution": f"{meta['width']}x{meta['height']}",
                "output_resolution": f"{meta['processed_width']}x{meta['processed_height']}",
                "fps": meta["fps"],
                "duration_seconds": meta["duration"],
                "has_audio": meta["has_audio"],
                "stabilization_applied": enable_stabilization,
                "output_filename": out_filename,
                "output_url": f"/api/media/output/{out_filename}",
                "download_url": f"/api/media/download/{out_filename}",
                "metrics": metrics,
            }

            # Persist to history
            history_service.add_record(
                record_id=job_id,
                file_name=input_video_path.name,
                module="Video Colorization",
                model_name="DDColor",
                input_resolution=f"{meta['width']}x{meta['height']}",
                output_resolution=f"{meta['processed_width']}x{meta['processed_height']}",
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
                current_step="Video colorization completed successfully!",
                result=result_data,
            )

        except Exception as e:
            job_manager.update_job(
                job_id,
                status="failed",
                error=str(e),
                current_step=f"Processing failed: {str(e)}",
            )
        finally:
            # Safely clean up temporary frames directory
            if temp_job_dir.exists():
                shutil.rmtree(temp_job_dir, ignore_errors=True)
            device_manager.cleanup_memory()


video_colorization_service = VideoColorizationService()


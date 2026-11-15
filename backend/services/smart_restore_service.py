import time
import uuid
import json
from pathlib import Path
from typing import Dict, Any, Optional

from backend.config import OUTPUTS_DIR
from backend.core.device_manager import device_manager
from backend.services.media_analysis_service import media_analysis_service
from backend.services.image_service import image_service
from backend.services.image_super_resolution_service import image_super_resolution_service
from backend.services.history_service import history_service


class SmartRestoreService:
    """
    Combines DDColor semantic colorization and Real-ESRGAN super-resolution
    into an intelligent, rule-guided multi-stage restoration workflow.
    """

    @staticmethod
    def execute_smart_restore(
        input_image_path: Path,
        mode: str = "quick",  # 'quick' or 'advanced'
        enable_colorization: Optional[bool] = None,
        scale: Optional[int] = None,
        preferred_format: str = "png",
    ) -> Dict[str, Any]:
        if not input_image_path.exists():
            raise FileNotFoundError(f"Source image not found at {input_image_path}")

        # Step 1: Analyze physical properties
        analysis = media_analysis_service.analyze_image(input_image_path)
        rec = analysis["recommendation"]

        # Determine stage execution
        if mode == "quick":
            run_colorization = rec["needs_colorization"]
            run_scale = rec["recommended_scale"] if rec["recommended_scale"] in (2, 4) else 0
        else:
            run_colorization = enable_colorization if enable_colorization is not None else rec["needs_colorization"]
            run_scale = scale if scale in (2, 4) else 0

        job_id = str(uuid.uuid4())[:12]
        device_name = device_manager.get_device_name()
        start_total = time.perf_counter()

        stages_executed = []
        cur_working_path = input_image_path
        colorized_url = None
        colorized_time = 0.0

        # Stage 1: DDColor Colorization (if needed/selected)
        if run_colorization:
            t0 = time.perf_counter()
            color_res = image_service.colorize_image(cur_working_path, preferred_format="png")
            colorized_time = round(time.perf_counter() - t0, 3)
            cur_working_path = OUTPUTS_DIR / color_res["png_filename"]
            colorized_url = color_res["png_url"]
            stages_executed.append({
                "stage": "Colorization",
                "model": "DDColor (ConvNeXt-Tiny + Transformer Color Decoder)",
                "duration_seconds": colorized_time,
                "output_resolution": color_res["output_resolution"],
                "output_url": color_res["png_url"],
            })

        # Stage 2: Real-ESRGAN Super-Resolution (if selected)
        final_url = None
        final_png_filename = None
        final_jpg_filename = None
        sr_time = 0.0
        final_resolution = f"{analysis['dimensions']['width']}x{analysis['dimensions']['height']}"

        if run_scale in (2, 4):
            t0 = time.perf_counter()
            sr_res = image_super_resolution_service.upscale_image(
                cur_working_path, scale=run_scale, preferred_format=preferred_format
            )
            sr_time = round(time.perf_counter() - t0, 3)
            final_resolution = sr_res["output_resolution"]
            final_url = sr_res["png_url"] if preferred_format == "png" else sr_res["jpg_url"]
            final_png_filename = sr_res["png_filename"]
            final_jpg_filename = sr_res["jpg_filename"]
            stages_executed.append({
                "stage": f"Super-Resolution ({run_scale}x)",
                "model": f"Real-ESRGAN x4plus (23-Block RRDBNet, {run_scale}x Mode)",
                "duration_seconds": sr_time,
                "output_resolution": sr_res["output_resolution"],
                "output_url": sr_res["png_url"],
            })
        elif run_colorization:
            # Colorization only was run
            final_url = color_res["png_url"] if preferred_format == "png" else color_res["jpg_url"]
            final_png_filename = color_res["png_filename"]
            final_jpg_filename = color_res["jpg_filename"]
            final_resolution = color_res["output_resolution"]
        else:
            # Neither was selected (pass-through fallback)
            final_url = f"/api/media/upload/{input_image_path.name}"
            final_png_filename = input_image_path.name

        total_elapsed = round(time.perf_counter() - start_total, 3)

        # Generate summary text file
        summary_filename = f"summary_{job_id}_{input_image_path.stem}.txt"
        summary_path = OUTPUTS_DIR / summary_filename
        summary_text = (
            f"===================================================================\n"
            f"VISION AI — SMART RESTORATION REPORT\n"
            f"===================================================================\n"
            f"Job ID:             {job_id}\n"
            f"Source File:        {input_image_path.name}\n"
            f"Restoration Mode:   {mode.upper()}\n"
            f"Compute Device:     {device_name}\n"
            f"Total Duration:     {total_elapsed} seconds\n\n"
            f"--- PHYSICAL ANALYSIS ---\n"
            f"Initial Resolution: {analysis['dimensions']['width']}x{analysis['dimensions']['height']}\n"
            f"Palette:            {analysis['color_profile']['palette_type']}\n"
            f"Sharpness Grade:    {analysis['sharpness']['grade']} (Laplacian Var: {analysis['sharpness']['laplacian_variance']})\n"
            f"Contrast Grade:     {analysis['contrast']['grade']}\n"
            f"Noise Estimate:     {analysis['noise']['grade']}\n\n"
            f"--- RESTORATION PIPELINE EXECUTED ---\n"
        )
        for s in stages_executed:
            summary_text += f"• Stage: {s['stage']}\n  Model: {s['model']}\n  Time:  {s['duration_seconds']}s\n"
        summary_text += (
            f"\nFinal Resolution:   {final_resolution}\n"
            f"Final Output:       {final_png_filename}\n"
            f"===================================================================\n"
        )
        with open(summary_path, "w") as f:
            f.write(summary_text)

        # Record to history database
        stage_names = " + ".join([s["stage"] for s in stages_executed]) if stages_executed else "No Stages"
        history_service.add_record(
            record_id=job_id,
            file_name=input_image_path.name,
            module=f"Smart Restore ({mode.capitalize()}: {stage_names})",
            model_name="DDColor + Real-ESRGAN x4plus",
            input_resolution=f"{analysis['dimensions']['width']}x{analysis['dimensions']['height']}",
            output_resolution=final_resolution,
            device=device_name,
            duration_sec=total_elapsed,
            status="completed",
            output_url=final_url,
            download_url=f"/api/media/download/{final_png_filename}",
            metrics={
                "mode": mode,
                "stages": stages_executed,
                "analysis": analysis,
                "total_elapsed": total_elapsed,
            },
        )

        return {
            "success": True,
            "job_id": job_id,
            "mode": mode,
            "device": device_name,
            "total_elapsed_seconds": total_elapsed,
            "input_resolution": f"{analysis['dimensions']['width']}x{analysis['dimensions']['height']}",
            "output_resolution": final_resolution,
            "analysis": analysis,
            "stages_executed": stages_executed,
            "colorized_url": colorized_url,
            "final_output_url": final_url,
            "png_filename": final_png_filename,
            "jpg_filename": final_jpg_filename,
            "summary_url": f"/api/media/output/{summary_filename}",
            "download_url": f"/api/media/download/{final_png_filename}",
        }


smart_restore_service = SmartRestoreService()


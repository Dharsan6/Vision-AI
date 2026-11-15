from pathlib import Path
from typing import Dict, Any
import cv2
import numpy as np


class MediaAnalysisService:
    """
    Analyzes physical properties of media (chromaticity, sharpness, noise, contrast, resolution)
    to generate transparent, rule-based AI restoration recommendations.
    """

    @staticmethod
    def analyze_image(image_path: Path) -> Dict[str, Any]:
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found at {image_path}")

        img_bgr = cv2.imread(str(image_path))
        if img_bgr is None:
            raise ValueError(f"Could not decode image at {image_path}")

        h, w = img_bgr.shape[:2]
        total_pixels = h * w
        file_size_mb = round(image_path.stat().st_size / (1024 * 1024), 2)

        # 1. Grayscale vs Color Detection
        # Convert to HSV and evaluate Saturation channel
        img_hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
        sat = img_hsv[:, :, 1]
        mean_saturation = float(np.mean(sat))
        sat_std = float(np.std(sat))

        # Also check color difference across channels (B-G and G-R)
        b, g, r = cv2.split(img_bgr)
        diff_bg = np.mean(np.abs(b.astype(float) - g.astype(float)))
        diff_gr = np.mean(np.abs(g.astype(float) - r.astype(float)))
        chroma_diff = float((diff_bg + diff_gr) / 2.0)

        # If mean saturation < 20.0 or chroma difference < 10.0, classify as grayscale/monochrome
        is_grayscale = (chroma_diff < 10.0) or (mean_saturation < 18.0)

        # 2. Sharpness & Blur Estimation (Laplacian Variance)
        img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        laplacian_var = float(cv2.Laplacian(img_gray, cv2.CV_64F).var())

        if laplacian_var < 75.0:
            sharpness_grade = "Blurry / Soft Focus"
            sharpness_score = round(min(laplacian_var / 75.0 * 40.0, 40.0), 1)
            is_blurry = True
        elif laplacian_var < 200.0:
            sharpness_grade = "Moderate Sharpness"
            sharpness_score = round(40.0 + (laplacian_var - 75.0) / 125.0 * 35.0, 1)
            is_blurry = False
        else:
            sharpness_grade = "High Sharpness"
            sharpness_score = round(min(75.0 + (laplacian_var - 200.0) / 300.0 * 25.0, 100.0), 1)
            is_blurry = False

        # 3. Dynamic Range & Contrast Estimation
        min_lum = float(np.min(img_gray))
        max_lum = float(np.max(img_gray))
        dynamic_range = max_lum - min_lum
        lum_std = float(np.std(img_gray))

        if lum_std < 35.0:
            contrast_grade = "Low Contrast (Flat)"
        elif lum_std < 65.0:
            contrast_grade = "Standard Contrast"
        else:
            contrast_grade = "High Dynamic Range"

        # 4. High-Frequency Noise Estimation
        # Difference between original grayscale and median-blurred version
        blur_gray = cv2.medianBlur(img_gray, 3)
        noise_residual = np.abs(img_gray.astype(float) - blur_gray.astype(float))
        noise_level = float(np.mean(noise_residual))

        if noise_level < 2.5:
            noise_grade = "Low / Clean"
        elif noise_level < 6.0:
            noise_grade = "Moderate Grain / Compression Artifacts"
        else:
            noise_grade = "High Sensor Noise / Film Grain"

        # 5. Resolution Categorization
        if w < 640 or h < 480 or total_pixels < 350_000:
            res_category = "Low-Resolution (Vintage / Archive)"
            recommended_scale = 4
        elif w < 1280 or h < 720:
            res_category = "Standard Definition (SD)"
            recommended_scale = 2
        elif w < 1920 or h < 1080:
            res_category = "High Definition (HD)"
            recommended_scale = 2 if is_blurry else 0
        else:
            res_category = "Ultra High Definition (UHD)"
            recommended_scale = 0

        # 6. Synthesize Recommendations
        recommended_stages = []
        explanation = []

        if is_grayscale:
            recommended_stages.append("colorization")
            explanation.append("Monochrome palette detected: DDColor deep learning colorization recommended.")
        else:
            explanation.append("Natural chromatic colors detected: Colorization skipped to preserve original hues.")

        if recommended_scale > 0:
            recommended_stages.append(f"super_resolution_{recommended_scale}x")
            explanation.append(
                f"Resolution is {w}x{h} ({res_category}) with {sharpness_grade}: "
                f"Real-ESRGAN {recommended_scale}x deep upscaling recommended."
            )
        else:
            explanation.append("High native resolution detected: Super-resolution optional.")

        return {
            "dimensions": {"width": w, "height": h, "total_pixels": total_pixels},
            "file_size_mb": file_size_mb,
            "color_profile": {
                "is_grayscale": is_grayscale,
                "mean_saturation": round(mean_saturation, 2),
                "chroma_variance": round(chroma_diff, 2),
                "palette_type": "Grayscale / Monochrome" if is_grayscale else "Color (Polychromatic)",
            },
            "sharpness": {
                "laplacian_variance": round(laplacian_var, 1),
                "score": sharpness_score,
                "grade": sharpness_grade,
                "is_blurry": is_blurry,
            },
            "contrast": {
                "luminance_std": round(lum_std, 1),
                "dynamic_range": f"{int(min_lum)} - {int(max_lum)}",
                "grade": contrast_grade,
            },
            "noise": {
                "estimated_residual": round(noise_level, 2),
                "grade": noise_grade,
            },
            "resolution_category": res_category,
            "recommendation": {
                "needs_colorization": is_grayscale,
                "recommended_scale": recommended_scale,
                "stages": recommended_stages,
                "summary": "Full Restoration (DDColor + Real-ESRGAN)" if (is_grayscale and recommended_scale > 0)
                           else ("Colorization Only" if is_grayscale else f"Super-Resolution Only ({recommended_scale}x)"),
                "explanation": " ".join(explanation),
            },
        }


media_analysis_service = MediaAnalysisService()

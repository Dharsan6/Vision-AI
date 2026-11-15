import os
import unittest
import numpy as np
import cv2
from pathlib import Path

from backend.config import MODELS_DIR, SAMPLES_DIR, OUTPUTS_DIR
from backend.core.device_manager import device_manager
from backend.models.model_manager import model_manager
from backend.services.image_service import image_service
from backend.services.image_super_resolution_service import image_super_resolution_service
from backend.services.media_analysis_service import media_analysis_service
from backend.services.smart_restore_service import smart_restore_service
from backend.core.frame_extractor import VideoFrameExtractor
from backend.core.video_reconstructor import VideoReconstructor


class TestVisionAIPipeline(unittest.TestCase):
    def test_01_device_detection(self):
        status = device_manager.get_system_status()
        self.assertIn("device", status)
        self.assertIn("memory", status)
        print(f"[TEST 1 PASSED] Device detected: {status['device_name']}")

    def test_02_model_weights_exist(self):
        ddcolor_path = MODELS_DIR / "ddcolor_paper_tiny.pth"
        realesrgan_path = MODELS_DIR / "RealESRGAN_x4plus.pth"
        self.assertTrue(ddcolor_path.exists(), "DDColor weights file missing")
        self.assertTrue(realesrgan_path.exists(), "Real-ESRGAN weights file missing")
        self.assertGreater(ddcolor_path.stat().st_size, 10 * 1024 * 1024)
        self.assertGreater(realesrgan_path.stat().st_size, 10 * 1024 * 1024)
        print("[TEST 2 PASSED] Both pretrained weight files verified on disk.")

    def test_03_ddcolor_inference(self):
        predictor = model_manager.get_ddcolor(input_size=512)
        sample_path = SAMPLES_DIR / "sample_portrait_gray.jpg"
        self.assertTrue(sample_path.exists())
        img = cv2.imread(str(sample_path))
        h, w = img.shape[:2]
        out = predictor.colorize(img)
        self.assertEqual(out.shape, (h, w, 3), "Output dimensions must match input dimensions")
        self.assertEqual(out.dtype, np.uint8)
        print(f"[TEST 3 PASSED] DDColor inference succeeded on {w}x{h} image.")

    def test_04_realesrgan_inference(self):
        predictor = model_manager.get_realesrgan(scale=4, tile_size=512)
        dummy = np.random.randint(0, 255, (48, 48, 3), dtype=np.uint8)
        out_4x = predictor.enhance(dummy, outscale=4)
        out_2x = predictor.enhance(dummy, outscale=2)
        self.assertEqual(out_4x.shape, (192, 192, 3))
        self.assertEqual(out_2x.shape, (96, 96, 3))
        print("[TEST 4 PASSED] Real-ESRGAN 2x and 4x inference succeeded.")

    def test_05_video_metadata(self):
        video_path = SAMPLES_DIR / "sample_motion_gray.mp4"
        self.assertTrue(video_path.exists())
        meta = VideoFrameExtractor.get_video_metadata(video_path)
        self.assertGreater(meta["frame_count"], 0)
        self.assertGreater(meta["fps"], 0)
        print(f"[TEST 5 PASSED] Video metadata: {meta['width']}x{meta['height']} @ {meta['fps']} FPS.")

    def test_06_image_super_resolution_service(self):
        sample_path = SAMPLES_DIR / "sample_portrait_gray.jpg"
        self.assertTrue(sample_path.exists())
        res_2x = image_super_resolution_service.upscale_image(sample_path, scale=2)
        self.assertTrue(res_2x["success"])
        self.assertEqual(res_2x["output_resolution"], "1024x1024")
        print(f"[TEST 6 PASSED] Image Super-Resolution Service: 512x512 -> {res_2x['output_resolution']} in {res_2x['elapsed_seconds']}s.")

    def test_07_smart_restore_pipeline(self):
        sample_path = SAMPLES_DIR / "sample_portrait_gray.jpg"
        self.assertTrue(sample_path.exists())
        analysis = media_analysis_service.analyze_image(sample_path)
        self.assertTrue(analysis["color_profile"]["is_grayscale"])
        self.assertIn("colorization", analysis["recommendation"]["stages"])

        # Execute Smart Restore with 2x scale for quick test
        restore_res = smart_restore_service.execute_smart_restore(
            sample_path, mode="advanced", enable_colorization=True, scale=2
        )
        self.assertTrue(restore_res["success"])
        self.assertEqual(restore_res["output_resolution"], "1024x1024")
        self.assertEqual(len(restore_res["stages_executed"]), 2)
        print(f"[TEST 7 PASSED] Smart Restore Combined Pipeline: 512x512 -> {restore_res['output_resolution']} in {restore_res['total_elapsed_seconds']}s ({len(restore_res['stages_executed'])} stages).")


if __name__ == "__main__":
    unittest.main()


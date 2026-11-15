import io
import time
import threading
from pathlib import Path
import cv2
import numpy as np
import torch
import torch.nn.functional as F

from backend.models.ddcolor_arch.model import DDColor

# Thread-safe lock for forward inference to protect intermediate decoder hooks
DDCOLOR_LOCK = threading.Lock()


class DDColorPredictor:
    """
    DDColor deep learning inference wrapper.
    Restores photo-realistic colors from grayscale images in CIE Lab color space
    while preserving original image dimensions and fine texture details.
    """
    def __init__(self, model_path: str, input_size: int = 512, device=None):
        self.input_size = input_size
        self.device = device or torch.device("mps" if torch.backends.mps.is_available() else "cpu")

        # Initialize DDColor model architecture (ConvNeXt-Tiny + MultiScaleColorDecoder)
        self.model = DDColor(
            encoder_name="convnext-t",
            decoder_name="MultiScaleColorDecoder",
            num_input_channels=3,
            input_size=(self.input_size, self.input_size),
            nf=512,
            num_output_channels=2,
            last_norm="Spectral",
            do_normalize=False,
            num_queries=100,
            num_scales=3,
            dec_layers=9,
        )

        # Robust binary stream loading with automatic retry on transient OS I/O lock
        state_dict = None
        last_error = None
        for attempt in range(3):
            try:
                with open(model_path, "rb") as f:
                    buf = io.BytesIO(f.read())
                ckpt = torch.load(buf, map_location="cpu")
                state_dict = ckpt["params"] if isinstance(ckpt, dict) and "params" in ckpt else ckpt
                del buf, ckpt
                break
            except (IOError, OSError) as io_err:
                last_error = io_err
                time.sleep(0.15 * (attempt + 1))

        if state_dict is None:
            raise RuntimeError(f"Unable to read DDColor checkpoint at {model_path}: {last_error}")

        self.model.load_state_dict(state_dict, strict=False)
        self.model.to(self.device)
        self.model.eval()

    def colorize(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Colorize a BGR image array.
        Returns: Colorized BGR image with exact original resolution (H, W, 3).
        Thread-safe execution using DDCOLOR_LOCK.
        """
        if img_bgr is None:
            raise ValueError("Input image is None")

        with DDCOLOR_LOCK:
            height, width = img_bgr.shape[:2]
            img_norm = (img_bgr / 255.0).astype(np.float32)

            # Extract original resolution L (lightness) channel
            orig_lab = cv2.cvtColor(img_norm, cv2.COLOR_BGR2Lab)
            orig_l = orig_lab[:, :, :1]

            # Resize to input_size for model inference
            img_resized = cv2.resize(img_norm, (self.input_size, self.input_size))
            img_l_resized = cv2.cvtColor(img_resized, cv2.COLOR_BGR2Lab)[:, :, :1]

            # Create 3-channel grayscale RGB representation expected by ConvNeXt
            gray_lab = np.concatenate([img_l_resized, np.zeros_like(img_l_resized), np.zeros_like(img_l_resized)], axis=-1)
            gray_rgb = cv2.cvtColor(gray_lab, cv2.COLOR_Lab2RGB)

            tensor_in = torch.from_numpy(gray_rgb.transpose(2, 0, 1)).unsqueeze(0).float().to(self.device)

            with torch.inference_mode():
                output_ab = self.model(tensor_in)

            output_ab_np = output_ab.squeeze(0).permute(1, 2, 0).cpu().numpy()
            del tensor_in, output_ab

            output_ab_resized = (
                cv2.resize(output_ab_np, (width, height), interpolation=cv2.INTER_CUBIC)
                if (width, height) != (self.input_size, self.input_size)
                else output_ab_np
            )

            fused_lab = np.concatenate([orig_l, output_ab_resized], axis=-1)
            fused_bgr = cv2.cvtColor(fused_lab, cv2.COLOR_Lab2BGR)
            return (np.clip(fused_bgr, 0.0, 1.0) * 255.0).round().astype(np.uint8)

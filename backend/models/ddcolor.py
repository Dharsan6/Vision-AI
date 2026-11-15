import cv2
import numpy as np
import torch
import torch.nn.functional as F
from pathlib import Path

from backend.models.ddcolor_arch.model import DDColor


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

        ckpt = torch.load(model_path, map_location="cpu")
        state_dict = ckpt["params"] if isinstance(ckpt, dict) and "params" in ckpt else ckpt
        self.model.load_state_dict(state_dict, strict=False)
        self.model.to(self.device)
        self.model.eval()

    def colorize(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Colorize a BGR image array.
        Returns: Colorized BGR image with exact original resolution (H, W, 3).
        """
        if img_bgr is None:
            raise ValueError("Input image is None")

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
        gray_rgb = cv2.cvtColor(gray_lab, cv2.COLOR_LAB2RGB)

        tensor_gray = torch.from_numpy(gray_rgb.transpose(2, 0, 1)).float().unsqueeze(0).to(self.device)

        with torch.inference_mode():
            output_ab = self.model(tensor_gray).cpu()

        # Bilinearly interpolate predicted ab channels back to original image dimensions
        output_ab_resized = (
            F.interpolate(output_ab, size=(height, width), mode="bilinear", align_corners=False)[0]
            .float()
            .numpy()
            .transpose(1, 2, 0)
        )

        # Fuse original high-resolution L channel with predicted ab color channels
        fused_lab = np.concatenate([orig_l, output_ab_resized], axis=-1)
        fused_bgr = cv2.cvtColor(fused_lab, cv2.COLOR_LAB2BGR)
        output_img = (np.clip(fused_bgr, 0.0, 1.0) * 255.0).round().astype(np.uint8)

        return output_img


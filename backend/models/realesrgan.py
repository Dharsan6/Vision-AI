import io
import math
import time
import threading
from typing import Optional, Callable
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

# Global inference lock to prevent concurrent jobs from thrashing MPS memory
REALESRGAN_LOCK = threading.Lock()


class ResidualDenseBlock_5C(nn.Module):
    """5-convolution residual dense block used in RRDB."""
    def __init__(self, nf=64, gc=32, bias=True):
        super(ResidualDenseBlock_5C, self).__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1, bias=bias)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1, bias=bias)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1, bias=bias)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1, bias=bias)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1, bias=bias)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    """Residual in Residual Dense Block."""
    def __init__(self, nf, gc=32):
        super(RRDB, self).__init__()
        self.rdb1 = ResidualDenseBlock_5C(nf, gc)
        self.rdb2 = ResidualDenseBlock_5C(nf, gc)
        self.rdb3 = ResidualDenseBlock_5C(nf, gc)

    def forward(self, x):
        out = self.rdb1(x)
        out = self.rdb2(out)
        out = self.rdb3(out)
        return out * 0.2 + x


class RRDBNet(nn.Module):
    """Networks consisting of Residual in Residual Dense Block (RRDB).
    Ref: Real-ESRGAN (Wang et al.)
    """
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4):
        super(RRDBNet, self).__init__()
        self.scale = scale
        self.conv_first = nn.Conv2d(num_in_ch, num_feat, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(num_feat, gc=num_grow_ch) for _ in range(num_block)])
        self.conv_body = nn.Conv2d(num_feat, num_feat, 3, 1, 1)

        # Upsampling
        self.conv_up1 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_hr = nn.Conv2d(num_feat, num_feat, 3, 1, 1)
        self.conv_last = nn.Conv2d(num_feat, num_out_ch, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(negative_slope=0.2, inplace=True)

    def forward(self, x):
        feat = self.conv_first(x)
        body_feat = self.conv_body(self.body(feat))
        feat = feat + body_feat

        # Upsample 2x
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode='nearest')))
        # Upsample 4x
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode='nearest')))
        out = self.conv_last(self.lrelu(self.conv_hr(feat)))
        return out


class RealESRGANPredictor:
    """
    Inference wrapper for Real-ESRGAN with support for:
    - Apple Silicon MPS / CPU execution
    - Tiled inference for arbitrary high-resolution images without OOM
    - 2x or 4x output scaling
    """
    def __init__(self, model_path: str, scale: int = 4, tile_size: int = 512, tile_pad: int = 10, device=None):
        self.scale = scale
        self.tile_size = tile_size
        self.tile_pad = tile_pad
        self.device = device or torch.device("mps" if torch.backends.mps.is_available() else "cpu")

        self.model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        state_dict = None
        last_error = None
        for attempt in range(3):
            try:
                with open(model_path, "rb") as f:
                    buf = io.BytesIO(f.read())
                ckpt = torch.load(buf, map_location="cpu")
                state_dict = ckpt["params_ema"] if "params_ema" in ckpt else (ckpt["params"] if "params" in ckpt else ckpt)
                del buf, ckpt
                break
            except (IOError, OSError) as io_err:
                last_error = io_err
                time.sleep(0.15 * (attempt + 1))

        if state_dict is None:
            raise RuntimeError(f"Unable to read Real-ESRGAN checkpoint at {model_path}: {last_error}")

        self.model.load_state_dict(state_dict, strict=True)
        self.model.to(self.device)
        self.model.eval()

    def _tile_process(
        self,
        img_tensor_cpu: torch.Tensor,
        on_tile_done: Optional[Callable[[int, int], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> np.ndarray:
        """
        Process large tensor in overlapping tiles with minimal memory footprint:
        - Keeps full tensor and output buffer in host RAM, only dispatching individual tiles to MPS/GPU.
        - Avoids multi-gigabyte float32 allocations on Apple Silicon unified memory.
        - Notifies on_tile_done callback for real-time progress tracking.
        - Respects cancellation requests safely.
        """
        batch, channel, height, width = img_tensor_cpu.shape
        output_height = height * self.scale
        output_width = width * self.scale

        # Pre-allocate output buffer in host uint8 memory (1/4 memory of float32 on GPU)
        output_bgr = np.zeros((output_height, output_width, 3), dtype=np.uint8)

        tiles_x = math.ceil(width / self.tile_size)
        tiles_y = math.ceil(height / self.tile_size)
        total_tiles = tiles_x * tiles_y
        current_tile = 0

        for y in range(tiles_y):
            for x in range(tiles_x):
                if cancel_check and cancel_check():
                    raise InterruptedError("Job cancelled by user.")

                current_tile += 1

                ofs_x = x * self.tile_size
                ofs_y = y * self.tile_size
                input_start_x = ofs_x
                input_end_x = min(ofs_x + self.tile_size, width)
                input_start_y = ofs_y
                input_end_y = min(ofs_y + self.tile_size, height)

                # Pad boundaries
                input_start_x_pad = max(input_start_x - self.tile_pad, 0)
                input_end_x_pad = min(input_end_x + self.tile_pad, width)
                input_start_y_pad = max(input_start_y - self.tile_pad, 0)
                input_end_y_pad = min(input_end_y + self.tile_pad, height)

                pad_left = input_start_x - input_start_x_pad
                pad_top = input_start_y - input_start_y_pad

                # Send ONLY the single padded tile to MPS/GPU device
                input_tile = img_tensor_cpu[:, :, input_start_y_pad:input_end_y_pad, input_start_x_pad:input_end_x_pad].to(self.device)

                with torch.inference_mode():
                    output_tile = self.model(input_tile)

                # Crop padding from output tile
                out_pad_left = pad_left * self.scale
                out_pad_top = pad_top * self.scale
                out_tile_w = (input_end_x - input_start_x) * self.scale
                out_tile_h = (input_end_y - input_start_y) * self.scale

                cropped_tile = output_tile[:, :, out_pad_top:out_pad_top + out_tile_h, out_pad_left:out_pad_left + out_tile_w]
                cropped_np = cropped_tile.squeeze(0).clamp(0, 1).cpu().numpy().transpose(1, 2, 0)
                tile_bgr = (cropped_np[:, :, [2, 1, 0]] * 255.0).round().astype(np.uint8)

                output_start_x = input_start_x * self.scale
                output_end_x = input_end_x * self.scale
                output_start_y = input_start_y * self.scale
                output_end_y = input_end_y * self.scale

                output_bgr[output_start_y:output_end_y, output_start_x:output_end_x] = tile_bgr

                # Release local tensors immediately to keep MPS memory flat
                del input_tile, output_tile, cropped_tile

                if on_tile_done:
                    on_tile_done(current_tile, total_tiles)

        if self.device.type == "mps":
            torch.mps.empty_cache()

        return output_bgr

    def enhance(
        self,
        img_bgr: np.ndarray,
        outscale: int = 4,
        on_tile_done: Optional[Callable[[int, int], None]] = None,
        cancel_check: Optional[Callable[[], bool]] = None,
    ) -> np.ndarray:
        """
        Enhance BGR uint8 image array using Real-ESRGAN.
        Supports outscale=2 or outscale=4.
        Thread-safe execution with memory-conscious tile streaming.
        """
        import cv2

        with REALESRGAN_LOCK:
            h, w = img_bgr.shape[:2]
            img = img_bgr.astype(np.float32) / 255.0
            # Convert BGR to RGB and transpose to CHW on CPU
            img_rgb = img[:, :, [2, 1, 0]]
            tensor_cpu = torch.from_numpy(img_rgb.transpose(2, 0, 1)).unsqueeze(0)

            # Decide whether to use tiled inference based on size
            if h * w > self.tile_size * self.tile_size:
                out_bgr = self._tile_process(tensor_cpu, on_tile_done=on_tile_done, cancel_check=cancel_check)
            else:
                if on_tile_done:
                    on_tile_done(0, 1)
                img_tensor = tensor_cpu.to(self.device)
                with torch.inference_mode():
                    out_tensor = self.model(img_tensor)

                out_tensor = out_tensor.squeeze(0).clamp(0, 1).cpu().numpy().transpose(1, 2, 0)
                out_bgr = (out_tensor[:, :, [2, 1, 0]] * 255.0).round().astype(np.uint8)
                del img_tensor, out_tensor
                if self.device.type == "mps":
                    torch.mps.empty_cache()
                if on_tile_done:
                    on_tile_done(1, 1)

            # If user requested 2x instead of model's native 4x, downsample with high-quality area interpolation
            if outscale == 2:
                out_bgr = cv2.resize(out_bgr, (w * 2, h * 2), interpolation=cv2.INTER_AREA)

            return out_bgr


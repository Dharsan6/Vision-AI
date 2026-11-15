import cv2
import numpy as np
from typing import Optional, Tuple


class TemporalStabilizer:
    """
    Detects scene changes and smooths frame-to-frame chrominance jitter
    in colorized videos without blurring luminance or edge details.
    """

    def __init__(self, scene_threshold: float = 0.40, smooth_alpha: float = 0.80):
        self.scene_threshold = scene_threshold
        self.smooth_alpha = smooth_alpha
        self.prev_gray: Optional[np.ndarray] = None
        self.prev_chroma: Optional[np.ndarray] = None
        self.scene_count = 1

    def reset(self):
        self.prev_gray = None
        self.prev_chroma = None
        self.scene_count = 1

    def is_scene_cut(self, current_gray: np.ndarray) -> bool:
        """
        Detects if current frame belongs to a new scene using histogram comparison.
        """
        if self.prev_gray is None:
            return False

        hist_prev = cv2.calcHist([self.prev_gray], [0], None, [64], [0, 256])
        hist_curr = cv2.calcHist([current_gray], [0], None, [64], [0, 256])

        cv2.normalize(hist_prev, hist_prev, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
        cv2.normalize(hist_curr, hist_curr, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

        # Correlation metric: 1.0 is identical, < 0.6 indicates sharp scene change
        corr = cv2.compareHist(hist_prev, hist_curr, cv2.HISTCMP_CORREL)
        return corr < (1.0 - self.scene_threshold)

    def process_frame(self, frame_bgr: np.ndarray) -> Tuple[np.ndarray, bool]:
        """
        Stabilizes chrominance for current frame.
        Returns: (stabilized_bgr_frame, is_cut)
        """
        # Convert BGR to Lab for decoupled luminance/chrominance manipulation
        frame_lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2Lab).astype(np.float32)
        curr_l = frame_lab[:, :, 0:1]
        curr_chroma = frame_lab[:, :, 1:3]  # a and b channels
        curr_gray = frame_lab[:, :, 0].astype(np.uint8)

        is_cut = False
        if self.prev_gray is not None:
            is_cut = self.is_scene_cut(curr_gray)
            if is_cut:
                self.scene_count += 1
                stabilized_chroma = curr_chroma
            else:
                # Within same scene: apply temporal exponential smoothing to chrominance
                stabilized_chroma = (
                    self.smooth_alpha * curr_chroma + (1.0 - self.smooth_alpha) * self.prev_chroma
                )
        else:
            stabilized_chroma = curr_chroma

        # Update historical state
        self.prev_gray = curr_gray
        self.prev_chroma = stabilized_chroma

        # Recombine exact current luminance with stabilized chroma
        stabilized_lab = np.concatenate([curr_l, stabilized_chroma], axis=-1)
        stabilized_lab = np.clip(stabilized_lab, 0, 255).astype(np.uint8)
        stabilized_bgr = cv2.cvtColor(stabilized_lab, cv2.COLOR_Lab2BGR)

        return stabilized_bgr, is_cut


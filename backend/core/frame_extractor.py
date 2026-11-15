import cv2
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, Generator, Tuple
import numpy as np


class VideoFrameExtractor:
    """
    Handles video metadata extraction, frame reading, and downscaling
    using OpenCV and FFmpeg.
    """

    @staticmethod
    def get_video_metadata(video_path: Path) -> Dict[str, Any]:
        """
        Extract video resolution, duration, FPS, total frame count, and audio presence.
        """
        video_path = Path(video_path)
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise ValueError(f"Unable to open video file: {video_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        # Sanitize FPS
        if not fps or np.isnan(fps) or fps <= 0 or fps > 120:
            fps = 25.0

        # Query ffprobe for authoritative stream info (audio, rational avg_frame_rate, duration)
        has_audio = False
        duration = 0.0
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "stream=codec_type,avg_frame_rate,duration,nb_frames:format=duration",
                "-of", "json",
                str(video_path),
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                streams = data.get("streams", [])
                has_audio = any(s.get("codec_type") == "audio" for s in streams)
                
                # Check video stream for avg_frame_rate
                for s in streams:
                    if s.get("codec_type") == "video":
                        avg_rate = s.get("avg_frame_rate", "")
                        if "/" in avg_rate:
                            num, den = avg_rate.split("/")
                            if float(den) > 0:
                                parsed_fps = float(num) / float(den)
                                if 1.0 <= parsed_fps <= 120.0:
                                    fps = parsed_fps
                        if not frame_count or frame_count <= 0:
                            if s.get("nb_frames") and str(s.get("nb_frames")).isdigit():
                                frame_count = int(s.get("nb_frames"))

                # Duration from format or calculation
                fmt_duration = data.get("format", {}).get("duration")
                if fmt_duration:
                    duration = round(float(fmt_duration), 2)
        except Exception:
            pass

        if duration <= 0.0 and frame_count > 0 and fps > 0:
            duration = round(frame_count / fps, 2)

        return {
            "width": width,
            "height": height,
            "fps": fps,
            "frame_count": frame_count,
            "duration": duration,
            "has_audio": has_audio,
            "file_size_mb": round(video_path.stat().st_size / (1024 * 1024), 2),
        }

    @staticmethod
    def extract_frames_to_dir(
        video_path: Path,
        output_dir: Path,
        target_resolution: str = "original",
        max_frames: int = 0,
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Extract video frames as images into output_dir.
        Optionally resizes frames to target_resolution (e.g. '480p', '720p', 'original').
        """
        video_path = Path(video_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        meta = VideoFrameExtractor.get_video_metadata(video_path)
        cap = cv2.VideoCapture(str(video_path))

        target_w, target_h = meta["width"], meta["height"]
        if target_resolution == "480p" and meta["height"] > 480:
            target_h = 480
            target_w = int(meta["width"] * (480 / meta["height"]))
        elif target_resolution == "720p" and meta["height"] > 720:
            target_h = 720
            target_w = int(meta["width"] * (720 / meta["height"]))

        # Ensure dimensions are even numbers for H.264
        target_w = (target_w // 2) * 2
        target_h = (target_h // 2) * 2

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if (target_w, target_h) != (meta["width"], meta["height"]):
                frame = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)

            frame_path = output_dir / f"frame_{frame_idx:06d}.png"
            cv2.imwrite(str(frame_path), frame)
            frame_idx += 1

            if max_frames > 0 and frame_idx >= max_frames:
                break

        cap.release()
        meta["processed_width"] = target_w
        meta["processed_height"] = target_h
        meta["extracted_frame_count"] = frame_idx
        return frame_idx, meta


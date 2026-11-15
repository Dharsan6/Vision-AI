import subprocess
import shutil
from pathlib import Path
from typing import Optional


class VideoReconstructor:
    """
    Assembles processed frame sequences into universal web-playable H.264 MP4 videos
    with optional original audio muxing using FFmpeg.
    """

    @staticmethod
    def reconstruct(
        frames_pattern: str,
        fps: float,
        output_video_path: Path,
        source_video_with_audio: Optional[Path] = None,
        crf: int = 18,
    ) -> Path:
        """
        Reconstruct video from frames using FFmpeg.
        - frames_pattern: e.g. "/path/to/frames/frame_%06d.png"
        - fps: frame rate
        - output_video_path: final output path (.mp4)
        - source_video_with_audio: original video to extract and mux audio from
        """
        output_video_path.parent.mkdir(parents=True, exist_ok=True)
        temp_video_no_audio = output_video_path.with_name(f"{output_video_path.stem}_noaudio.mp4")

        # Step 1: Encode video stream with H.264 (yuv420p for 100% browser compatibility)
        video_cmd = [
            "ffmpeg",
            "-y",
            "-r", str(fps),
            "-i", frames_pattern,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", str(crf),
            "-preset", "medium",
            "-movflags", "+faststart",
            str(temp_video_no_audio),
        ]

        result = subprocess.run(video_cmd, capture_output=True, text=True, check=False)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg video encoding failed: {result.stderr}")

        # Step 2: Mux audio from source video if provided and audio stream exists
        if source_video_with_audio and source_video_with_audio.exists():
            audio_cmd = [
                "ffmpeg",
                "-y",
                "-i", str(temp_video_no_audio),
                "-i", str(source_video_with_audio),
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v:0",
                "-map", "1:a:0?",
                "-shortest",
                "-movflags", "+faststart",
                str(output_video_path),
            ]
            audio_res = subprocess.run(audio_cmd, capture_output=True, text=True, check=False)
            if audio_res.returncode == 0 and output_video_path.exists():
                if temp_video_no_audio.exists():
                    temp_video_no_audio.unlink()
                return output_video_path

        # If no audio or audio muxing was skipped, move no-audio video to target
        if temp_video_no_audio.exists():
            shutil.move(str(temp_video_no_audio), str(output_video_path))

        return output_video_path


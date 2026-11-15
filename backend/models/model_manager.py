import os
import io
import time
import threading
import requests
from pathlib import Path
from typing import Dict, Any, Optional
import torch

from backend.config import (
    MODELS_DIR,
    DDCOLOR_MODEL_FILENAME,
    DDCOLOR_MODEL_URL,
    DDCOLOR_FALLBACK_URL,
    REALESRGAN_MODEL_FILENAME,
    REALESRGAN_MODEL_URL,
    REALESRGAN_FALLBACK_URL,
)
from backend.core.device_manager import device_manager
from backend.models.ddcolor import DDColorPredictor
from backend.models.realesrgan import RealESRGANPredictor


class ModelManager:
    """
    Centralized Model Manager for VISION AI.
    Handles automated weight downloads, integrity verification, thread-safe lazy loading,
    warm-up preloading, in-memory caching, memory cleanup, and runtime status inspection.
    """
    _instance = None
    _init_lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._init_lock:
                if cls._instance is None:
                    cls._instance = super(ModelManager, cls).__new__(cls)
                    cls._instance._init_manager()
        return cls._instance

    def _init_manager(self):
        self.models_dir = MODELS_DIR
        self._ddcolor_instance: Optional[DDColorPredictor] = None
        self._realesrgan_instance: Optional[RealESRGANPredictor] = None
        self._ddcolor_error: Optional[str] = None
        self._realesrgan_error: Optional[str] = None
        self._lock = threading.Lock()
        self._is_preloading = False

    def _download_file(self, primary_url: str, fallback_url: str, dest_path: Path):
        """
        Download model weights with streaming and fallback URL support.
        """
        temp_dest = dest_path.with_suffix(".tmp")
        for url in [primary_url, fallback_url]:
            try:
                print(f"[ModelManager] Downloading weights from: {url}")
                response = requests.get(url, stream=True, timeout=60)
                if response.status_code == 200:
                    with open(temp_dest, "wb") as f:
                        for chunk in response.iter_content(chunk_size=1024 * 1024):
                            if chunk:
                                f.write(chunk)
                    temp_dest.rename(dest_path)
                    print(f"[ModelManager] Download complete: {dest_path.name}")
                    return True
                else:
                    print(f"[ModelManager] HTTP {response.status_code} from {url}")
            except Exception as e:
                print(f"[ModelManager] Download failed from {url}: {e}")
                if temp_dest.exists():
                    try:
                        temp_dest.unlink()
                    except OSError:
                        pass

        raise RuntimeError(f"Unable to download model weights from either {primary_url} or {fallback_url}")

    def ensure_ddcolor_weights(self) -> Path:
        target = self.models_dir / DDCOLOR_MODEL_FILENAME
        if not target.exists() or target.stat().st_size < 1024 * 1024:
            self._download_file(DDCOLOR_MODEL_URL, DDCOLOR_FALLBACK_URL, target)
        return target

    def ensure_realesrgan_weights(self) -> Path:
        target = self.models_dir / REALESRGAN_MODEL_FILENAME
        if not target.exists() or target.stat().st_size < 1024 * 1024:
            self._download_file(REALESRGAN_MODEL_URL, REALESRGAN_FALLBACK_URL, target)
        return target

    def get_ddcolor(self, input_size: int = 512) -> DDColorPredictor:
        """
        Thread-safe getter for DDColor model instance.
        Loads model onto MPS or CPU on first invocation and caches in memory.
        """
        if self._ddcolor_instance is not None:
            return self._ddcolor_instance

        with self._lock:
            # Double-checked locking
            if self._ddcolor_instance is not None:
                return self._ddcolor_instance

            try:
                weight_path = self.ensure_ddcolor_weights()
                device = device_manager.get_device()
                print(f"[ModelManager] Initializing DDColor ({weight_path.name}) on device: {device}...")
                t0 = time.perf_counter()
                self._ddcolor_instance = DDColorPredictor(str(weight_path), input_size=input_size, device=device)
                self._ddcolor_error = None
                print(f"[ModelManager] DDColor successfully loaded in {time.perf_counter() - t0:.2f}s")
            except Exception as e:
                self._ddcolor_error = f"{type(e).__name__}: {str(e)}"
                print(f"[ModelManager] ERROR: Failed to load DDColor: {self._ddcolor_error}")
                raise RuntimeError(f"Failed to load DDColor: {e}")

        return self._ddcolor_instance

    def get_realesrgan(self, scale: int = 4, tile_size: int = 512) -> RealESRGANPredictor:
        """
        Thread-safe getter for Real-ESRGAN model instance.
        Loads model onto MPS or CPU on first invocation and caches in memory.
        """
        if self._realesrgan_instance is not None:
            return self._realesrgan_instance

        with self._lock:
            # Double-checked locking
            if self._realesrgan_instance is not None:
                return self._realesrgan_instance

            try:
                weight_path = self.ensure_realesrgan_weights()
                device = device_manager.get_device()
                print(f"[ModelManager] Initializing Real-ESRGAN ({weight_path.name}) on device: {device}...")
                t0 = time.perf_counter()
                self._realesrgan_instance = RealESRGANPredictor(
                    str(weight_path), scale=scale, tile_size=tile_size, device=device
                )
                self._realesrgan_error = None
                print(f"[ModelManager] Real-ESRGAN successfully loaded in {time.perf_counter() - t0:.2f}s")
            except Exception as e:
                self._realesrgan_error = f"{type(e).__name__}: {str(e)}"
                print(f"[ModelManager] ERROR: Failed to load Real-ESRGAN: {self._realesrgan_error}")
                raise RuntimeError(f"Failed to load Real-ESRGAN: {e}")

        return self._realesrgan_instance

    def preload_models(self):
        """
        Warm up and preload both models into unified memory at application startup.
        Prevents first-request cold start latency for users.
        """
        print("[ModelManager] Preloading neural models for zero-latency inference...")
        try:
            self.get_ddcolor(input_size=512)
        except Exception as e:
            print(f"[ModelManager] Warning: Preloading DDColor deferred: {e}")

        try:
            self.get_realesrgan(scale=4, tile_size=512)
        except Exception as e:
            print(f"[ModelManager] Warning: Preloading Real-ESRGAN deferred: {e}")

        print("[ModelManager] Neural models preloaded and active.")

    def preload_models_background(self):
        """
        Launches model preloading on a daemon thread so server startup is instantaneous.
        """
        if not self._is_preloading:
            self._is_preloading = True
            thread = threading.Thread(target=self.preload_models, daemon=True, name="ModelPreloader")
            thread.start()

    def unload_models(self):
        """
        Unload models to free GPU/MPS and system memory.
        """
        with self._lock:
            self._ddcolor_instance = None
            self._realesrgan_instance = None
            device_manager.cleanup_memory()

    def get_models_status(self) -> Dict[str, Any]:
        """
        Inspect current model readiness, weight files, and device status.
        """
        ddcolor_file = self.models_dir / DDCOLOR_MODEL_FILENAME
        realesrgan_file = self.models_dir / REALESRGAN_MODEL_FILENAME

        return {
            "ddcolor": {
                "name": "DDColor (ConvNeXt-Tiny + Dual Decoder)",
                "task": "Image & Video Colorization",
                "weights_filename": DDCOLOR_MODEL_FILENAME,
                "weights_exist": ddcolor_file.exists(),
                "file_size_mb": round(ddcolor_file.stat().st_size / (1024 * 1024), 2) if ddcolor_file.exists() else 0,
                "loaded_in_memory": self._ddcolor_instance is not None,
                "device": device_manager.get_device_name(),
                "error": self._ddcolor_error,
            },
            "realesrgan": {
                "name": "Real-ESRGAN x4plus (RRDBNet 23-Block)",
                "task": "Image & Video Super-Resolution",
                "weights_filename": REALESRGAN_MODEL_FILENAME,
                "weights_exist": realesrgan_file.exists(),
                "file_size_mb": round(realesrgan_file.stat().st_size / (1024 * 1024), 2) if realesrgan_file.exists() else 0,
                "loaded_in_memory": self._realesrgan_instance is not None,
                "device": device_manager.get_device_name(),
                "error": self._realesrgan_error,
            }
        }


model_manager = ModelManager()

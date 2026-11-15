import gc
import platform
import os
import psutil
import torch

class DeviceManager:
    """
    Manages compute devices (Apple Silicon MPS, CUDA, CPU fallback),
    memory tracking, and cleanup for VISION AI.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DeviceManager, cls).__new__(cls)
            cls._instance._init_device()
        return cls._instance

    def _init_device(self):
        self.os_name = platform.system()
        self.architecture = platform.machine()
        self.processor = platform.processor()

        if torch.backends.mps.is_available():
            self.device_type = "mps"
            self.device = torch.device("mps")
            self.device_name = "Apple Silicon (MPS Acceleration)"
        elif torch.cuda.is_available():
            self.device_type = "cuda"
            self.device = torch.device("cuda")
            self.device_name = torch.cuda.get_device_name(0)
        else:
            self.device_type = "cpu"
            self.device = torch.device("cpu")
            self.device_name = "CPU (Accelerated Fallback)"

    def get_device(self) -> torch.device:
        return self.device

    def get_device_name(self) -> str:
        return self.device_name

    def get_system_status(self) -> dict:
        """
        Retrieves real-time system hardware, memory, and device stats.
        """
        vm = psutil.virtual_memory()
        cpu_usage = psutil.cpu_percent(interval=None)

        mps_available = torch.backends.mps.is_available()
        cuda_available = torch.cuda.is_available()

        # Current memory stats
        total_ram_gb = round(vm.total / (1024 ** 3), 2)
        available_ram_gb = round(vm.available / (1024 ** 3), 2)
        used_ram_gb = round(vm.used / (1024 ** 3), 2)
        ram_percent = vm.percent

        return {
            "platform": f"{self.os_name} ({self.architecture})",
            "processor": self.processor or "Apple Silicon",
            "device": self.device_type,
            "device_name": self.device_name,
            "mps_supported": mps_available,
            "cuda_supported": cuda_available,
            "cpu_usage_percent": cpu_usage,
            "memory": {
                "total_gb": total_ram_gb,
                "used_gb": used_ram_gb,
                "available_gb": available_ram_gb,
                "percent_used": ram_percent,
            }
        }

    def cleanup_memory(self):
        """
        Perform deep memory cleanup across PyTorch MPS/CUDA and Python garbage collection.
        """
        gc.collect()
        if self.device_type == "mps" and hasattr(torch, "mps"):
            try:
                torch.mps.empty_cache()
            except Exception:
                pass
        elif self.device_type == "cuda":
            try:
                torch.cuda.empty_cache()
            except Exception:
                pass

# Global singleton instance
device_manager = DeviceManager()


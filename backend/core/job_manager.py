import threading
import time
from typing import Dict, Any, Optional, Callable


class JobManager:
    """
    Thread-safe asynchronous background job manager for long-running video inference tasks.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(JobManager, cls).__new__(cls)
                    cls._instance._jobs: Dict[str, Dict[str, Any]] = {}
        return cls._instance

    def create_job(self, job_id: str, module: str, filename: str) -> Dict[str, Any]:
        with self._lock:
            job = {
                "job_id": job_id,
                "module": module,
                "filename": filename,
                "status": "queued",  # queued, processing, completed, failed
                "progress": 0.0,
                "current_frame": 0,
                "total_frames": 0,
                "current_step": "Initializing job",
                "start_time": time.time(),
                "end_time": None,
                "elapsed_seconds": 0.0,
                "result": None,
                "error": None,
            }
            self._jobs[job_id] = job
            return job

    def update_job(
        self,
        job_id: str,
        status: Optional[str] = None,
        progress: Optional[float] = None,
        current_frame: Optional[int] = None,
        total_frames: Optional[int] = None,
        current_step: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ):
        with self._lock:
            if job_id not in self._jobs:
                return
            job = self._jobs[job_id]
            if status is not None:
                job["status"] = status
            if progress is not None:
                job["progress"] = min(100.0, max(0.0, round(progress, 1)))
            if current_frame is not None:
                job["current_frame"] = current_frame
            if total_frames is not None:
                job["total_frames"] = total_frames
            if current_step is not None:
                job["current_step"] = current_step
            if result is not None:
                job["result"] = result
            if error is not None:
                job["error"] = error
            if job["start_time"]:
                job["elapsed_seconds"] = round(time.time() - job["start_time"], 2)
            if status in ("completed", "failed", "cancelled"):
                job["end_time"] = time.time()

    def cancel_job(self, job_id: str) -> bool:
        """
        Request cancellation of an active or queued job.
        """
        with self._lock:
            if job_id not in self._jobs:
                return False
            job = self._jobs[job_id]
            if job["status"] in ("completed", "failed", "cancelled"):
                return False
            job["status"] = "cancelled"
            job["current_step"] = "Job cancelled by user"
            job["end_time"] = time.time()
            if job["start_time"]:
                job["elapsed_seconds"] = round(time.time() - job["start_time"], 2)
            return True

    def is_cancelled(self, job_id: str) -> bool:
        """
        Thread-safe check to determine if a job was cancelled.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            return job is not None and job.get("status") == "cancelled"

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def run_in_background(self, target_fn: Callable, *args, **kwargs):
        """
        Executes target function in dedicated daemon thread.
        """
        thread = threading.Thread(target=target_fn, args=args, kwargs=kwargs, daemon=True)
        thread.start()
        return thread


job_manager = JobManager()


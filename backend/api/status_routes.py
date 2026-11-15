from fastapi import APIRouter
from backend.core.device_manager import device_manager
from backend.models.model_manager import model_manager

router = APIRouter(tags=["Status & System"])


@router.api_route("/health", methods=["GET", "HEAD"])
def get_health():
    """
    Service health check endpoint.
    """
    return {
        "status": "online",
        "service": "VISION AI Backend API",
        "version": "1.0.0",
    }


@router.get("/system/status")
def get_system_status():
    """
    Real-time system hardware, chip, device, and memory telemetry.
    """
    return device_manager.get_system_status()


@router.get("/models/status")
def get_models_status():
    """
    Pretrained deep learning model download, weight size, and memory status.
    """
    return model_manager.get_models_status()


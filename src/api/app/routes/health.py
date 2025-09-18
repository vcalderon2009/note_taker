from fastapi import APIRouter

from ..config.settings import settings
from ..models.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(port=settings.port)

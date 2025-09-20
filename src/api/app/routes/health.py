from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Tuple
import logging
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["health"])

class ServiceStatus(BaseModel):
    status: str
    error: str = None
    details: Dict[str, Any] = {}

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    services: Dict[str, ServiceStatus]
    models: List[str] = []
    system_ready: bool = False

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Comprehensive health check endpoint that returns the status of all services and models.
    """
    try:
        # Check database connection
        db_status = await _check_database()
        
        # Check Ollama service and models
        ollama_status, available_models = await _check_ollama()
        
        # Check if system is fully ready
        system_ready = (
            db_status.status == "healthy" and 
            ollama_status.status == "healthy" and 
            len(available_models) >= 2  # We expect at least 2 models
        )
        
        overall_status = "healthy" if system_ready else "degraded"
        
        return HealthResponse(
            status=overall_status,
            timestamp=datetime.utcnow().isoformat(),
            services={
                "database": db_status,
                "ollama": ollama_status
            },
            models=available_models,
            system_ready=system_ready
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow().isoformat(),
            services={
                "database": ServiceStatus(status="unknown", error=str(e)),
                "ollama": ServiceStatus(status="unknown", error=str(e))
            },
            models=[],
            system_ready=False
        )

async def _check_database() -> ServiceStatus:
    """Check database connectivity."""
    try:
        from ..db import SessionLocal
        # Test database connection by creating a session
        db = SessionLocal()
        try:
            # Simple query to test connection
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            return ServiceStatus(
                status="healthy",
                details={"connection": "active"}
            )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return ServiceStatus(
            status="unhealthy",
            error=str(e)
        )

async def _check_ollama() -> Tuple[ServiceStatus, List[str]]:
    """Check Ollama service and available models."""
    try:
        from ..config.settings import get_settings
        settings = get_settings()
        ollama_host = settings.ollama_host or "http://ollama:11434"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{ollama_host}/api/tags")
            response.raise_for_status()
            
            data = response.json()
            models = [model["name"] for model in data.get("models", [])]
            
            # Check if our expected models are available
            expected_models = ["deepseek-r1:8b", "llama3.2:1b"]
            missing_models = [model for model in expected_models if model not in models]
            
            if missing_models:
                return ServiceStatus(
                    status="degraded",
                    error=f"Missing models: {', '.join(missing_models)}",
                    details={"available_models": models, "missing_models": missing_models}
                ), models
            else:
                return ServiceStatus(
                    status="healthy",
                    details={"available_models": models, "total_models": len(models)}
                ), models
                
    except httpx.TimeoutException:
        return ServiceStatus(
            status="unhealthy",
            error="Ollama service timeout"
        ), []
    except httpx.ConnectError:
        return ServiceStatus(
            status="unhealthy",
            error="Ollama service unreachable"
        ), []
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        return ServiceStatus(
            status="unhealthy",
            error=str(e)
        ), []

@router.get("/health/ready")
async def readiness_check():
    """
    Simple readiness check that returns 200 when system is fully ready, 503 otherwise.
    """
    health = await health_check()
    
    if health.system_ready:
        return {"status": "ready", "timestamp": health.timestamp}
    else:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "not_ready",
                "reason": "System not fully initialized",
                "services": health.services,
                "models": health.models
            }
        )

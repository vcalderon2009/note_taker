from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, Optional
from datetime import datetime
from contextlib import contextmanager

import structlog
from fastapi import Request, Response


class TelemetryLogger:
    """
    Centralized telemetry and logging system for comprehensive observability.
    
    Features:
    - Structured logging with JSON output
    - Request/response tracking
    - Performance metrics
    - Token usage tracking
    - Error monitoring
    - User activity analytics
    """

    def __init__(self, service_name: str = "note-taker-api"):
        self.service_name = service_name
        self._setup_logging()

    def _setup_logging(self):
        """Configure structured logging with JSON output."""
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer()
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        
        # Configure Python logging to output JSON
        logging.basicConfig(
            format="%(message)s",
            level=logging.INFO,
        )
        
        self.logger = structlog.get_logger(self.service_name)

    def log_request_start(
        self, 
        request: Request, 
        request_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Log the start of a request and return context for tracking."""
        context = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "user_id": user_id,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "start_time": time.time(),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        self.logger.info(
            "Request started",
            **context
        )
        
        return context

    def log_request_end(
        self, 
        context: Dict[str, Any], 
        response: Response,
        error: Optional[Exception] = None
    ):
        """Log the end of a request with performance metrics."""
        end_time = time.time()
        duration_ms = int((end_time - context["start_time"]) * 1000)
        
        log_data = {
            **context,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "response_size": len(response.body) if hasattr(response, 'body') else None,
            "end_time": end_time,
        }
        
        if error:
            log_data["error"] = str(error)
            log_data["error_type"] = type(error).__name__
            self.logger.error("Request failed", **log_data)
        else:
            if response.status_code >= 400:
                self.logger.warning("Request completed with error", **log_data)
            else:
                self.logger.info("Request completed", **log_data)

    def log_llm_call(
        self,
        request_id: str,
        model: str,
        provider: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        duration_ms: int,
        cost_estimate: Optional[float] = None,
        temperature: float = 0.1,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log LLM API calls with token usage and cost tracking."""
        self.logger.info(
            "LLM call completed",
            request_id=request_id,
            event_type="llm_call",
            model=model,
            provider=provider,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            duration_ms=duration_ms,
            cost_estimate=cost_estimate,
            temperature=temperature,
            success=success,
            error=error,
            timestamp=datetime.utcnow().isoformat(),
        )

    def log_orchestrator_result(
        self,
        request_id: str,
        user_id: str,
        input_type: str,  # "simple_message" or "brain_dump"
        output_type: str,  # "note", "task", or "brain_dump"
        items_created: int,
        processing_time_ms: int,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log orchestrator processing results and analytics."""
        self.logger.info(
            "Orchestrator processing completed",
            request_id=request_id,
            event_type="orchestrator_result",
            user_id=user_id,
            input_type=input_type,
            output_type=output_type,
            items_created=items_created,
            processing_time_ms=processing_time_ms,
            success=success,
            error=error,
            timestamp=datetime.utcnow().isoformat(),
        )

    def log_user_activity(
        self,
        user_id: str,
        action: str,  # "create_note", "create_task", "send_message", etc.
        resource_type: str,  # "note", "task", "message", "conversation"
        resource_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log user activity for analytics and usage tracking."""
        self.logger.info(
            "User activity",
            event_type="user_activity",
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata or {},
            timestamp=datetime.utcnow().isoformat(),
        )

    def log_error(
        self,
        error: Exception,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        """Log errors with context for debugging and alerting."""
        self.logger.error(
            "Application error",
            event_type="error",
            error_message=str(error),
            error_type=type(error).__name__,
            request_id=request_id,
            user_id=user_id,
            context=context or {},
            timestamp=datetime.utcnow().isoformat(),
            exc_info=True,
        )

    def log_performance_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "ms",
        tags: Optional[Dict[str, str]] = None
    ):
        """Log performance metrics for monitoring and alerting."""
        self.logger.info(
            "Performance metric",
            event_type="performance_metric",
            metric_name=metric_name,
            value=value,
            unit=unit,
            tags=tags or {},
            timestamp=datetime.utcnow().isoformat(),
        )

    @contextmanager
    def track_operation(
        self,
        operation_name: str,
        request_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Context manager to track operation duration and success/failure."""
        start_time = time.time()
        try:
            yield
            duration_ms = int((time.time() - start_time) * 1000)
            self.log_performance_metric(
                f"{operation_name}_duration",
                duration_ms,
                "ms",
                {"request_id": request_id, "success": "true", **(metadata or {})}
            )
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self.log_performance_metric(
                f"{operation_name}_duration",
                duration_ms,
                "ms",
                {"request_id": request_id, "success": "false", **(metadata or {})}
            )
            self.log_error(e, request_id=request_id, context={"operation": operation_name})
            raise


# Global telemetry logger instance
telemetry = TelemetryLogger()

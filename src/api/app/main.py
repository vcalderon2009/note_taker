from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import settings
from .db import engine
from .middleware.idempotency import IdempotencyMiddleware
from .middleware.enhanced_rate_limit import EnhancedRateLimitMiddleware, RateLimitConfig
from .middleware.telemetry import TelemetryMiddleware
from .models.orm import Base
from .routes.conversations import router as conversations_router
from .routes.health import router as health_router
from .routes.messages import router as messages_router
from .routes.notes import router as notes_router
from .routes.tasks import router as tasks_router
from .routes.categories import router as categories_router
from .routes.classification import router as classification_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    import os
    
    # Skip lifespan setup during testing
    if os.getenv("TESTING"):
        yield
        return
        
    from .db import SessionLocal
    from .models.orm import Conversation, User

    try:
        Base.metadata.create_all(bind=engine)

        # Create default user and conversation if they don't exist
        with SessionLocal() as db:
            existing_user = db.query(User).filter(User.id == 1).first()
            if not existing_user:
                default_user = User(email="default@example.com")
                db.add(default_user)
                db.commit()

            existing_conversation = db.query(Conversation).filter(Conversation.id == 1).first()
            if not existing_conversation:
                default_conversation = Conversation(user_id=1, title="Default Conversation")
                db.add(default_conversation)
                db.commit()
    except Exception:
        pass
    yield


app = FastAPI(title="Note-Taker API", version="0.1.0", lifespan=lifespan)

# Add CORS middleware FIRST (to handle preflight OPTIONS requests before other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now to test
    allow_credentials=False,  # Disable credentials for broader compatibility
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Re-enable other middleware now that CORS is configured
app.add_middleware(TelemetryMiddleware)  # Track all requests
app.add_middleware(IdempotencyMiddleware)  # Handle idempotency

# Configure enhanced rate limiting with different limits per endpoint
endpoint_configs = {
    "messages:post": RateLimitConfig(limit=10, window_seconds=60),  # 10 messages per minute
    "notes:post": RateLimitConfig(limit=20, window_seconds=60),     # 20 notes per minute  
    "tasks:post": RateLimitConfig(limit=20, window_seconds=60),     # 20 tasks per minute
}

app.add_middleware(
    EnhancedRateLimitMiddleware,  # Apply rate limiting
    default_config=RateLimitConfig(limit=30, window_seconds=60),  # Default: 30 requests/min
    endpoint_configs=endpoint_configs,
)

app.include_router(health_router)  # Comprehensive health at /api/health and /api/health/ready
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(notes_router)
app.include_router(tasks_router)
app.include_router(categories_router)
app.include_router(classification_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.port)

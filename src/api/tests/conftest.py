import os
import sys
import importlib
from unittest.mock import Mock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Ensure the src/api directory is on PYTHONPATH for test imports
CURRENT_DIR = os.path.dirname(__file__)
PROJECT_SRC = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PROJECT_SRC not in sys.path:
    sys.path.insert(0, PROJECT_SRC)

# Import these after setting up the database URL override below

def create_mock_llm_provider():
    """Create a mock LLM provider for testing."""
    # Import LLMResponse here to avoid import-time issues
    from app.adapters.llm_provider.base import LLMResponse
    
    mock_provider = Mock()
    
    def mock_generate(model, messages, temperature=0.1):
        # Simple logic to return note or task based on input
        user_message = messages[-1].content.lower()
        if "task:" in user_message or "todo" in user_message:
            return LLMResponse(
                model_id=model,
                content='{"type": "task", "task": {"title": "' + user_message.replace("task:", "").strip() + '", "status": "todo"}}',
                latency_ms=100
            )
        else:
            return LLMResponse(
                model_id=model,
                content='{"type": "note", "note": {"title": "' + user_message[:50] + '", "body": "' + user_message + '"}}',
                latency_ms=100
            )
    
    mock_provider.generate = mock_generate
    return mock_provider


@pytest.fixture(scope="function")
def client():
    """Create a test client with completely isolated database for each test."""
    # Set testing environment variable to skip lifespan
    os.environ["TESTING"] = "1"
    # Override database URL to use a temporary SQLite file for tests  
    # Note: Using :memory: creates separate databases for each connection
    # Using a file ensures all connections share the same database
    import tempfile
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    os.environ["DATABASE_URL"] = f"sqlite:///{temp_db.name}"
    
    # Force reload database modules to pick up new DATABASE_URL
    if 'app.config.settings' in sys.modules:
        importlib.reload(sys.modules['app.config.settings'])
    if 'app.db' in sys.modules:
        importlib.reload(sys.modules['app.db'])
    
    # Now import all the modules we need
    from app.adapters.llm_provider.base import LLMResponse  # noqa: E402
    from app.db import get_db  # noqa: E402
    from app.main import app  # noqa: E402
    # Import all models to ensure they're registered with Base
    from app.models.orm import Base, User, Conversation, Message, Note, Task, ToolRun, AuditLog  # noqa: E402
    from app.services.orchestrator_service import OrchestratorService  # noqa: E402
    from app import db as db_module
    from app.config.settings import settings
    
    # Verify we're using SQLite now
    assert "sqlite" in settings.database_url.lower(), f"Expected SQLite, got {settings.database_url}"
    
    # Create isolated test database with same URL as settings
    test_engine = create_engine(
        settings.database_url, 
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for debugging SQL
    )
    
    # Enable foreign key constraints for SQLite
    @event.listens_for(test_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def test_get_db():
        """Test database dependency that uses the test database."""
        db = TestSessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    # Store original values for restoration
    original_engine = db_module.engine
    original_SessionLocal = db_module.SessionLocal
    original_get_db = db_module.get_db
    
    # Replace the database module's globals with test versions
    db_module.engine = test_engine
    db_module.SessionLocal = TestSessionLocal
    db_module.get_db = test_get_db
    
    # Override the FastAPI dependency as well (belt and suspenders)
    app.dependency_overrides[get_db] = test_get_db

    # Mock OrchestratorService to avoid LLM calls
    original_orchestrator_init = OrchestratorService.__init__
    
    def mock_orchestrator_init(self, provider=None, model=None):
        self.provider = create_mock_llm_provider()
        self.model = "test-model"
        self.context_window_size = 10
        self.max_context_tokens = 4000
        self.brain_dump_threshold = 100
    
    OrchestratorService.__init__ = mock_orchestrator_init
    
    # Create all tables in the test database
    Base.metadata.create_all(bind=test_engine)
    
    # Create basic test data
    with TestSessionLocal() as db:
        try:
            # Create test user
            user = User(email="test@example.com")
            db.add(user)
            db.flush()
            db.refresh(user)
            
            # Create test conversation
            conversation = Conversation(user_id=user.id, title="Test Conversation")
            db.add(conversation)
            db.flush()
            db.refresh(conversation)
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise e

    # Create test client
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        # Cleanup - restore everything to original state
        OrchestratorService.__init__ = original_orchestrator_init
        app.dependency_overrides.clear()
        
        # Restore original database module globals
        db_module.engine = original_engine
        db_module.SessionLocal = original_SessionLocal
        db_module.get_db = original_get_db
        
        # Drop all tables and dispose engine
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()
        
        # Clean up temporary database file
        db_url = os.environ.get("DATABASE_URL", "")
        if db_url.startswith("sqlite:///") and db_url != "sqlite:///:memory:":
            db_path = db_url.replace("sqlite:///", "")
            if os.path.exists(db_path):
                os.unlink(db_path)
        
        # Clean up environment variables
        os.environ.pop("TESTING", None)
        os.environ.pop("DATABASE_URL", None)

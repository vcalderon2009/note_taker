from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
import logging
import os

from ..adapters.llm_provider.reasoning import ReasoningLLMProvider
from ..config.settings import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["classification"])

class ClassificationRequest(BaseModel):
    message: str

class ClassificationResponse(BaseModel):
    classification: Literal['BRAIN_DUMP', 'SIMPLE_TASK', 'SIMPLE_NOTE', 'MESSAGE_ANALYSIS']
    confidence: float
    reasoning: str

CLASSIFICATION_PROMPT = """
You are a message classifier for a note-taking AI assistant. Analyze the user's message and classify it into one of these categories:

1. **BRAIN_DUMP**: Long, complex messages with multiple ideas, tasks, or notes. Often meeting notes, brainstorming sessions, or stream-of-consciousness thoughts with multiple actionable items.

2. **SIMPLE_TASK**: Clear requests to create a task, todo item, or action item. Usually contains action verbs and specific things to be done.

3. **SIMPLE_NOTE**: Thoughts, ideas, or information to remember. Often starts with "I'm thinking", "Remember", or contains project ideas, observations, or notes.

4. **MESSAGE_ANALYSIS**: General questions, requests for help, or messages that need analysis but don't clearly fit the other categories.

Message to classify: "{message}"

Respond with ONLY a JSON object in this exact format:
{{
    "classification": "BRAIN_DUMP|SIMPLE_TASK|SIMPLE_NOTE|MESSAGE_ANALYSIS",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this classification was chosen"
}}
"""

@router.post("/classify-message", response_model=ClassificationResponse)
async def classify_message(request: ClassificationRequest):
    """
    Classify a user message into one of the predefined categories using LLM reasoning.
    Supports multiple reasoning models including GPT-OSS, OpenAI, and Ollama.
    """
    try:
        settings = get_settings()
        
        # Determine which reasoning model to use
        provider_type = "ollama"  # Default
        model = "deepseek-r1:8b"  # Default to deepseek-r1:8b (better reasoning)
        host = settings.ollama_host or "http://ollama:11434"
        api_key = None
        
        # Check for OpenAI configuration (highest priority)
        if os.getenv("OPENAI_API_KEY"):
            provider_type = "openai"
            api_key = os.getenv("OPENAI_API_KEY")
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        
        # Check if user wants to use fallback model (llama3.2:1b)
        elif os.getenv("USE_FALLBACK_MODEL") == "true":
            provider_type = "ollama"
            model = settings.ollama_model or "llama3.2:1b"
            host = settings.ollama_host or "http://ollama:11434"
        
        # Initialize reasoning LLM provider
        reasoning_llm = ReasoningLLMProvider(
            provider_type=provider_type,
            model=model,
            host=host,
            api_key=api_key,
            temperature=0.1,  # Low temperature for consistent classification
            max_tokens=200   # Short response for classification
        )
        
        # Get classification using the specialized method
        result = await reasoning_llm.classify_message(request.message)
        
        return ClassificationResponse(**result)
            
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        # Return fallback classification
        return _fallback_classification(request.message)

def _fallback_classification(message: str) -> ClassificationResponse:
    """Fallback classification using simple heuristics."""
    text = message.lower()
    is_long = len(message) > 100
    has_multiple = any(sep in message for sep in [' and ', ', ', '; '])
    
    if is_long and has_multiple:
        return ClassificationResponse(
            classification="BRAIN_DUMP",
            confidence=0.7,
            reasoning="Long message with multiple items (fallback heuristic)"
        )
    elif any(keyword in text for keyword in ['task', 'todo', 'create a task', 'schedule', 'need to', 'review']):
        return ClassificationResponse(
            classification="SIMPLE_TASK",
            confidence=0.6,
            reasoning="Task-related keywords detected (fallback heuristic)"
        )
    elif any(keyword in text for keyword in ['note', 'remember', 'thinking', 'project', 'idea']):
        return ClassificationResponse(
            classification="SIMPLE_NOTE",
            confidence=0.6,
            reasoning="Note-related keywords detected (fallback heuristic)"
        )
    else:
        return ClassificationResponse(
            classification="MESSAGE_ANALYSIS",
            confidence=0.5,
            reasoning="General message requiring analysis (fallback heuristic)"
        )

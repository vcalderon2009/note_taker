"""
Reasoning LLM Provider for complex tasks like classification and analysis.
Supports various reasoning models including GPT-OSS, OpenAI, and local models.
"""

import json
import logging
from typing import Dict, Any, Optional, Literal
import httpx
from .base import LLMProvider

logger = logging.getLogger(__name__)

class ReasoningLLMProvider(LLMProvider):
    """Enhanced LLM provider optimized for reasoning tasks."""
    
    def __init__(
        self, 
        provider_type: Literal["openai", "ollama"] = "ollama",
        model: str = "llama3.2:1b",
        host: str = "http://ollama:11434",
        api_key: Optional[str] = None,
        temperature: float = 0.1,  # Lower temperature for more consistent reasoning
        max_tokens: int = 500
    ):
        self.provider_type = provider_type
        self.model = model
        self.host = host
        self.api_key = api_key
        self.temperature = temperature
        self.max_tokens = max_tokens
        
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate a response optimized for reasoning tasks."""
        
        if self.provider_type == "openai":
            return await self._openai_generate(prompt, system_prompt)
        else:  # ollama (including gpt-oss model)
            return await self._ollama_generate(prompt, system_prompt)
    
    async def _openai_generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using OpenAI API."""
        if not self.api_key:
            raise ValueError("OpenAI API key required")
            
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    
    
    async def _ollama_generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate using Ollama (fallback)."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
            
        async with httpx.AsyncClient() as client:
            url = f"{self.host}/api/chat"
            payload = {
                "model": self.model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": self.temperature,
                    "num_predict": self.max_tokens
                }
            }
            logger.info(f"Calling Ollama at {url} with model: {payload['model']}")
            response = await client.post(url, json=payload, timeout=60.0)
            logger.info(f"Ollama response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"Ollama error response: {response.text}")
            response.raise_for_status()
            return response.json()["message"]["content"]

    async def classify_message(self, message: str) -> Dict[str, Any]:
        """
        Specialized method for message classification with structured output.
        """
        system_prompt = """You are an expert message classifier. You analyze user messages and categorize them with high accuracy. Always respond with valid JSON only."""
        
        classification_prompt = f"""Classify this message: "{message}"

Choose one: BRAIN_DUMP, SIMPLE_TASK, SIMPLE_NOTE, or MESSAGE_ANALYSIS.

Respond with JSON:
{{"classification": "SIMPLE_TASK", "confidence": 0.8, "reasoning": "test"}}"""
        
        try:
            response = await self.generate_response(classification_prompt, system_prompt)
            
            # Clean up the response to extract JSON
            response = response.strip()
            if response.startswith("```json"):
                response = response[7:]
            if response.endswith("```"):
                response = response[:-3]
            response = response.strip()
            
            # Parse JSON response
            result = json.loads(response)
            
            # Validate required fields
            required_fields = ["classification", "confidence", "reasoning"]
            if not all(field in result for field in required_fields):
                raise ValueError("Missing required fields in response")
                
            # Validate classification value
            valid_classifications = ["BRAIN_DUMP", "SIMPLE_TASK", "SIMPLE_NOTE", "MESSAGE_ANALYSIS"]
            if result["classification"] not in valid_classifications:
                raise ValueError(f"Invalid classification: {result['classification']}")
                
            return result
            
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            logger.error(f"Raw response: {response if 'response' in locals() else 'No response'}")
            
            # Return fallback classification
            return {
                "classification": "MESSAGE_ANALYSIS",
                "confidence": 0.3,
                "reasoning": f"Classification failed, using fallback: {str(e)}"
            }

"""
Prompt Management System

Centralized loading and management of prompts from external configuration files.
Supports YAML format with environment-specific overrides and hot-reloading.
"""

import os
import yaml
from pathlib import Path
from typing import Any, Dict, Optional
from functools import lru_cache


class PromptManager:
    """Manages loading and caching of prompts from configuration files."""
    
    def __init__(self, prompts_dir: Optional[Path] = None):
        """Initialize the prompt manager.
        
        Args:
            prompts_dir: Directory containing prompt files. Defaults to this module's directory.
        """
        if prompts_dir is None:
            prompts_dir = Path(__file__).parent
        
        self.prompts_dir = Path(prompts_dir)
        self._cache: Dict[str, Dict[str, Any]] = {}
        
    def _load_prompt_file(self, filename: str) -> Dict[str, Any]:
        """Load a prompt file from disk.
        
        Args:
            filename: Name of the YAML file (without extension)
            
        Returns:
            Dictionary containing the prompt configuration
            
        Raises:
            FileNotFoundError: If the prompt file doesn't exist
            yaml.YAMLError: If the file contains invalid YAML
        """
        file_path = self.prompts_dir / f"{filename}.yaml"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    
    def get_prompt_config(self, service: str, use_cache: bool = True) -> Dict[str, Any]:
        """Get the full prompt configuration for a service.
        
        Args:
            service: Name of the service (e.g., 'orchestrator')
            use_cache: Whether to use cached version if available
            
        Returns:
            Dictionary containing all prompts for the service
        """
        if not use_cache or service not in self._cache:
            self._cache[service] = self._load_prompt_file(service)
        
        return self._cache[service]
    
    def get_prompt(self, service: str, prompt_name: str, use_cache: bool = True) -> Dict[str, Any]:
        """Get a specific prompt configuration.
        
        Args:
            service: Name of the service (e.g., 'orchestrator')
            prompt_name: Name of the prompt (e.g., 'simple_message', 'brain_dump')
            use_cache: Whether to use cached version if available
            
        Returns:
            Dictionary containing the prompt configuration
            
        Raises:
            KeyError: If the prompt doesn't exist
        """
        config = self.get_prompt_config(service, use_cache)
        
        if prompt_name not in config:
            raise KeyError(f"Prompt '{prompt_name}' not found in service '{service}'")
        
        return config[prompt_name]
    
    def get_system_prompt(self, service: str, prompt_name: str, use_cache: bool = True) -> str:
        """Get the system prompt text for a specific prompt.
        
        Args:
            service: Name of the service
            prompt_name: Name of the prompt
            use_cache: Whether to use cached version
            
        Returns:
            System prompt text
        """
        prompt_config = self.get_prompt(service, prompt_name, use_cache)
        return prompt_config.get('system_prompt', '')
    
    def get_temperature(self, service: str, prompt_name: str, default: float = 0.1, use_cache: bool = True) -> float:
        """Get the temperature setting for a specific prompt.
        
        Args:
            service: Name of the service
            prompt_name: Name of the prompt
            default: Default temperature if not specified
            use_cache: Whether to use cached version
            
        Returns:
            Temperature value
        """
        prompt_config = self.get_prompt(service, prompt_name, use_cache)
        return prompt_config.get('temperature', default)
    
    def get_fallback_config(self, service: str, use_cache: bool = True) -> Dict[str, Any]:
        """Get fallback configuration for a service.
        
        Args:
            service: Name of the service
            use_cache: Whether to use cached version
            
        Returns:
            Fallback configuration dictionary
        """
        config = self.get_prompt_config(service, use_cache)
        return config.get('fallback', {})
    
    def reload_cache(self, service: Optional[str] = None):
        """Reload cached prompt configurations.
        
        Args:
            service: Specific service to reload, or None to reload all
        """
        if service:
            self._cache.pop(service, None)
        else:
            self._cache.clear()


# Global instance for easy access
@lru_cache(maxsize=1)
def get_prompt_manager() -> PromptManager:
    """Get the global prompt manager instance."""
    return PromptManager()


# Convenience functions for common operations
def get_system_prompt(service: str, prompt_name: str) -> str:
    """Get a system prompt using the global manager."""
    return get_prompt_manager().get_system_prompt(service, prompt_name)


def get_temperature(service: str, prompt_name: str, default: float = 0.1) -> float:
    """Get a temperature setting using the global manager."""
    return get_prompt_manager().get_temperature(service, prompt_name, default)


def get_fallback_config(service: str) -> Dict[str, Any]:
    """Get fallback configuration using the global manager."""
    return get_prompt_manager().get_fallback_config(service)

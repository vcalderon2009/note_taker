"""
Tests for the prompt management system.
"""

import pytest
from pathlib import Path
import tempfile
import yaml

from app.prompts.manager import PromptManager, get_system_prompt, get_temperature


def test_prompt_manager_loads_config():
    """Test that PromptManager can load prompt configurations."""
    # Create a temporary prompt file
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_config = {
            'test_prompt': {
                'system_prompt': 'Test system prompt',
                'temperature': 0.5
            },
            'fallback': {
                'keywords': ['test', 'example']
            }
        }
        
        config_file = temp_path / 'test_service.yaml'
        with open(config_file, 'w') as f:
            yaml.safe_dump(test_config, f)
        
        # Test PromptManager
        manager = PromptManager(temp_path)
        config = manager.get_prompt_config('test_service')
        
        assert 'test_prompt' in config
        assert config['test_prompt']['system_prompt'] == 'Test system prompt'
        assert config['test_prompt']['temperature'] == 0.5


def test_prompt_manager_get_specific_prompt():
    """Test getting specific prompt configurations."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_config = {
            'brain_dump': {
                'system_prompt': 'Break down the input',
                'temperature': 0.3
            }
        }
        
        config_file = temp_path / 'orchestrator.yaml'
        with open(config_file, 'w') as f:
            yaml.safe_dump(test_config, f)
        
        manager = PromptManager(temp_path)
        prompt = manager.get_prompt('orchestrator', 'brain_dump')
        
        assert prompt['system_prompt'] == 'Break down the input'
        assert prompt['temperature'] == 0.3


def test_prompt_manager_convenience_methods():
    """Test convenience methods for getting system prompts and temperatures."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_config = {
            'simple_message': {
                'system_prompt': 'Classify the input',
                'temperature': 0.1
            }
        }
        
        config_file = temp_path / 'orchestrator.yaml'
        with open(config_file, 'w') as f:
            yaml.safe_dump(test_config, f)
        
        manager = PromptManager(temp_path)
        
        system_prompt = manager.get_system_prompt('orchestrator', 'simple_message')
        temperature = manager.get_temperature('orchestrator', 'simple_message')
        
        assert system_prompt == 'Classify the input'
        assert temperature == 0.1


def test_prompt_manager_fallback_config():
    """Test getting fallback configurations."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_config = {
            'fallback': {
                'task_keywords': ['task:', 'todo:', 'action:'],
                'brain_dump_indicators': {
                    'action_keywords': ['need to', 'should'],
                    'organizational_keywords': ['task', 'note']
                }
            }
        }
        
        config_file = temp_path / 'orchestrator.yaml'
        with open(config_file, 'w') as f:
            yaml.safe_dump(test_config, f)
        
        manager = PromptManager(temp_path)
        fallback = manager.get_fallback_config('orchestrator')
        
        assert 'task_keywords' in fallback
        assert 'brain_dump_indicators' in fallback
        assert fallback['task_keywords'] == ['task:', 'todo:', 'action:']


def test_prompt_manager_caching():
    """Test that PromptManager caches configurations properly."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_config = {'test': {'prompt': 'cached'}}
        
        config_file = temp_path / 'test.yaml'
        with open(config_file, 'w') as f:
            yaml.safe_dump(test_config, f)
        
        manager = PromptManager(temp_path)
        
        # First call should load from file
        config1 = manager.get_prompt_config('test')
        
        # Second call should use cache
        config2 = manager.get_prompt_config('test')
        
        assert config1 is config2  # Same object reference due to caching
        
        # Test cache reload
        manager.reload_cache('test')
        config3 = manager.get_prompt_config('test')
        
        assert config1 is not config3  # Different object after cache reload


def test_orchestrator_prompts_exist():
    """Test that the actual orchestrator prompts exist and are valid."""
    # Test that the real orchestrator.yaml file exists and has required prompts
    manager = PromptManager()  # Uses default path
    
    # Test that required prompts exist
    simple_prompt = manager.get_system_prompt('orchestrator', 'simple_message')
    brain_dump_prompt = manager.get_system_prompt('orchestrator', 'brain_dump')
    
    assert len(simple_prompt) > 0
    assert len(brain_dump_prompt) > 0
    
    # Test temperatures
    simple_temp = manager.get_temperature('orchestrator', 'simple_message')
    brain_dump_temp = manager.get_temperature('orchestrator', 'brain_dump')
    
    assert 0.0 <= simple_temp <= 1.0
    assert 0.0 <= brain_dump_temp <= 1.0
    
    # Test fallback config
    fallback = manager.get_fallback_config('orchestrator')
    assert 'task_keywords' in fallback
    assert 'brain_dump_indicators' in fallback

# Prompt Management System

This directory contains the centralized prompt management system for the Note-Taker AI Assistant. Prompts are stored in external YAML files, making them easy to modify, version, and maintain without touching source code.

## Benefits

- **🔧 Easy Maintenance**: Update prompts without changing Python code
- **📝 Version Control**: Track prompt changes with clear diffs
- **🤝 Collaboration**: Non-technical team members can contribute
- **🌍 Environment-specific**: Different prompts for dev/staging/prod
- **♻️ Reusability**: Share prompts across services
- **🔒 Security**: Sensitive prompts can be managed separately
- **🚀 Hot-reloading**: Cache can be cleared to reload prompts

## Structure

```
prompts/
├── __init__.py              # Package initialization
├── manager.py               # PromptManager class and utilities
├── orchestrator.yaml        # Orchestrator service prompts
└── README.md               # This documentation
```

## Usage Examples

### Basic Usage

```python
from app.prompts.manager import get_system_prompt, get_temperature

# Get a system prompt
prompt = get_system_prompt('orchestrator', 'brain_dump')

# Get temperature setting
temp = get_temperature('orchestrator', 'brain_dump', default=0.1)
```

### Advanced Usage

```python
from app.prompts.manager import PromptManager

manager = PromptManager()

# Get full prompt configuration
config = manager.get_prompt('orchestrator', 'simple_message')

# Get fallback configuration
fallback = manager.get_fallback_config('orchestrator')

# Reload cache (useful in development)
manager.reload_cache('orchestrator')
```

## Prompt File Format

Prompts are stored in YAML format with the following structure:

```yaml
# Service-specific prompts
prompt_name:
  system_prompt: |
    Your detailed system prompt here.
    Can span multiple lines.
  temperature: 0.1

# Fallback configurations
fallback:
  task_keywords:
    - "task:"
    - "todo:"
  brain_dump_indicators:
    action_keywords:
      - "need to"
      - "should"
```

## Current Prompts

### Orchestrator Service (`orchestrator.yaml`)

- **`simple_message`**: Classifies user input as note or task
- **`brain_dump`**: Processes complex multi-item inputs
- **`fallback`**: Heuristic rules for LLM failures

## Best Practices

1. **Keep prompts concise** but comprehensive
2. **Use clear instructions** and examples
3. **Test prompt changes** thoroughly
4. **Version control** all prompt modifications
5. **Document** the purpose of each prompt
6. **Use appropriate temperatures** for different tasks

## Testing

The prompt management system includes comprehensive tests:

```bash
cd src/api
poetry run pytest tests/test_prompt_management.py -v
```

## Environment Variables

The system supports environment-specific overrides through the standard settings mechanism. Prompts can reference environment variables or be completely replaced based on deployment context.

## Future Enhancements

- **A/B Testing**: Support for multiple prompt variants
- **Metrics Integration**: Track prompt performance
- **Dynamic Loading**: Hot-reload prompts without restart
- **Prompt Templates**: Parameterized prompts with variables
- **Multi-language**: Support for localized prompts

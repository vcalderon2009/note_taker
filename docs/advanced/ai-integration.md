# AI Integration

This document covers the AI integration architecture, configuration, and customization options for the Note-Taker AI system.

## Overview

The Note-Taker AI system uses a flexible, adapter-based architecture that supports multiple AI providers and models. This allows you to choose the best AI solution for your needs and easily switch between different providers.

## Supported AI Providers

### Ollama (Local)
**Best for**: Privacy, cost control, offline usage

- **Models**: llama3.2:3b, llama3.2:1b, and custom models
- **Deployment**: Local Docker container
- **Performance**: Fast response times, no network latency
- **Cost**: Free (hardware costs only)
- **Privacy**: Complete data privacy

### OpenAI (Cloud)
**Best for**: High accuracy, advanced capabilities

- **Models**: GPT-4, GPT-3.5-turbo, GPT-4o
- **Deployment**: Cloud-based API
- **Performance**: High accuracy, advanced reasoning
- **Cost**: Pay-per-use pricing
- **Privacy**: Data sent to OpenAI servers

## Configuration

### Environment Variables

```bash
# AI Provider Selection
LLM_PROVIDER=ollama  # or "openai"

# Ollama Configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# OpenAI Configuration
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Provider Selection

The system automatically selects the appropriate provider based on configuration:

```python
# Automatic provider selection
if os.getenv("LLM_PROVIDER") == "openai":
    provider = OpenAIProvider()
else:
    provider = OllamaProvider()
```

## AI Workflow

### Message Processing Pipeline

1. **Input Reception**: User message received
2. **Intent Classification**: Determine message type
3. **Context Retrieval**: Gather relevant context
4. **AI Processing**: Generate response and artifacts
5. **Response Generation**: Format and return results

### Intent Classification

The AI classifies user input into categories:

- **Note**: Information to remember
- **Task**: Actionable items
- **Brain Dump**: Complex, unstructured content
- **Chit Chat**: General conversation

### Context Management

The AI uses context to provide better responses:

- **Conversation History**: Recent messages
- **User Preferences**: Communication style
- **Relevant Information**: Related notes and tasks
- **System Context**: Current state and settings

## Model Configuration

### Ollama Models

#### llama3.2:3b
- **Size**: 3 billion parameters
- **Performance**: Good balance of speed and accuracy
- **Use Case**: General purpose, good for most tasks
- **Memory**: ~2GB RAM required

#### llama3.2:1b
- **Size**: 1 billion parameters
- **Performance**: Fast, lightweight
- **Use Case**: Simple tasks, quick responses
- **Memory**: ~1GB RAM required

#### Custom Models
You can use any Ollama-compatible model:

```bash
# Pull a custom model
docker-compose exec ollama ollama pull mistral:7b

# Update configuration
OLLAMA_MODEL=mistral:7b
```

### OpenAI Models

#### GPT-4
- **Performance**: Highest accuracy and reasoning
- **Use Case**: Complex tasks, advanced reasoning
- **Cost**: Higher cost per token
- **Context**: 128k tokens

#### GPT-3.5-turbo
- **Performance**: Good balance of speed and accuracy
- **Use Case**: General purpose, cost-effective
- **Cost**: Lower cost per token
- **Context**: 16k tokens

#### GPT-4o
- **Performance**: Optimized for speed and efficiency
- **Use Case**: Fast responses, good accuracy
- **Cost**: Competitive pricing
- **Context**: 128k tokens

## Customization

### Prompt Engineering

The system uses structured prompts for different tasks:

#### Intent Classification Prompt
```
You are an AI assistant that classifies user messages into categories.

Categories:
- note: Information to remember
- task: Actionable items
- brain_dump: Complex, unstructured content
- chit_chat: General conversation

Classify this message: "{message}"

Respond with JSON: {"classification": "category", "confidence": 0.95, "reasoning": "explanation"}
```

#### Note Creation Prompt
```
You are an AI assistant that creates structured notes from user input.

Create a well-organized note with:
- Clear, descriptive title
- Organized sections
- Key points highlighted
- Relevant tags

Input: "{message}"

Respond with JSON: {"title": "Note Title", "sections": [...], "tags": [...]}
```

### Custom Prompts

You can customize prompts by modifying the prompt files:

```yaml
# prompts/orchestrator.yaml
intent_classification:
  system_prompt: |
    You are an AI assistant that classifies user messages...
  examples:
    - input: "I need to remember to call John tomorrow"
      output: '{"classification": "task", "confidence": 0.95}'
```

### Model Parameters

Configure model behavior:

```python
# Model configuration
model_config = {
    "temperature": 0.7,        # Creativity (0.0-1.0)
    "max_tokens": 1000,        # Maximum response length
    "top_p": 0.9,              # Nucleus sampling
    "frequency_penalty": 0.0,  # Reduce repetition
    "presence_penalty": 0.0    # Encourage new topics
}
```

## Performance Optimization

### Response Time Optimization

1. **Model Selection**: Choose appropriate model size
2. **Context Management**: Limit context window
3. **Caching**: Cache frequent responses
4. **Parallel Processing**: Process multiple requests

### Cost Optimization

1. **Model Selection**: Use smaller models when possible
2. **Context Limiting**: Reduce context window size
3. **Response Caching**: Cache similar responses
4. **Batch Processing**: Group similar requests

### Quality Optimization

1. **Prompt Engineering**: Optimize prompts for accuracy
2. **Model Tuning**: Fine-tune models for specific tasks
3. **Context Quality**: Provide relevant context
4. **Response Validation**: Validate AI responses

## Monitoring and Analytics

### Performance Metrics

Track AI performance:

- **Response Time**: Time to generate responses
- **Token Usage**: Tokens consumed per request
- **Error Rate**: Failed requests percentage
- **Accuracy**: Classification and response accuracy

### Cost Tracking

Monitor AI costs:

- **Token Consumption**: Tokens used per request
- **Cost per Request**: Average cost per request
- **Monthly Usage**: Total monthly costs
- **Cost per User**: Cost per user per month

### Quality Metrics

Measure AI quality:

- **Classification Accuracy**: Intent classification success rate
- **Response Quality**: User satisfaction with responses
- **Error Analysis**: Common error patterns
- **Improvement Areas**: Areas needing improvement

## Troubleshooting

### Common Issues

#### Slow Responses
- Check model size and configuration
- Verify network connectivity
- Monitor resource usage
- Consider model optimization

#### Poor Quality Responses
- Review prompt engineering
- Check model parameters
- Verify context quality
- Consider model fine-tuning

#### High Costs
- Optimize model selection
- Implement response caching
- Limit context window
- Monitor usage patterns

### Debugging

Enable debug logging:

```bash
# Enable debug logging
LOG_LEVEL=DEBUG

# View AI logs
docker-compose logs -f api
```

### Performance Tuning

Optimize performance:

1. **Model Selection**: Choose appropriate model
2. **Context Management**: Optimize context window
3. **Caching**: Implement response caching
4. **Parallel Processing**: Use concurrent processing

## Advanced Features

### Custom Models

Train custom models for specific tasks:

1. **Data Preparation**: Prepare training data
2. **Model Training**: Train custom model
3. **Model Deployment**: Deploy to Ollama
4. **Integration**: Update configuration

### Multi-Model Support

Use multiple models for different tasks:

```python
# Different models for different tasks
models = {
    "classification": "llama3.2:1b",
    "note_creation": "llama3.2:3b",
    "conversation": "gpt-4"
}
```

### Model Switching

Switch models dynamically:

```python
# Switch model based on task complexity
if task_complexity > threshold:
    model = "gpt-4"
else:
    model = "llama3.2:3b"
```

## Security Considerations

### Data Privacy

Protect user data:

- **Local Processing**: Use Ollama for sensitive data
- **Data Encryption**: Encrypt data in transit and at rest
- **Access Control**: Control who can access AI services
- **Audit Logging**: Log all AI interactions

### Model Security

Secure AI models:

- **Model Validation**: Validate model outputs
- **Input Sanitization**: Sanitize user inputs
- **Output Filtering**: Filter inappropriate outputs
- **Rate Limiting**: Limit AI usage per user

## Future Enhancements

### Planned Features

1. **Fine-tuned Models**: Custom models for specific tasks
2. **Multi-modal Support**: Support for images and audio
3. **Real-time Learning**: Learn from user interactions
4. **Advanced Reasoning**: More sophisticated reasoning capabilities

### Integration Options

1. **External APIs**: Integrate with external AI services
2. **Custom Endpoints**: Support for custom AI endpoints
3. **Model Marketplace**: Access to model marketplace
4. **Federated Learning**: Collaborative model training

---

The AI integration system is designed to be flexible and powerful. Choose the right AI provider and configuration for your needs, and the system will adapt to provide the best possible experience.

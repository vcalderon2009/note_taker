# GPT-OSS Setup for Enhanced Message Classification

This guide explains how to set up GPT-OSS (or other reasoning models) for better message classification in the note-taker application.

## Current Implementation

The system now supports multiple reasoning models for message classification:

1. **GPT-OSS** (default) - Open-source reasoning model running through Ollama
2. **OpenAI** - Commercial API for high accuracy  
3. **Ollama Fallback** - Local LLM with llama3.2:1b as fallback

## Configuration Options

### Option 1: Using GPT-OSS (Default - Recommended)

GPT-OSS is now the default model for classification. First, pull the model:

```bash
# Pull gpt-oss model in Ollama
ollama pull gpt-oss

# No additional configuration needed - it's the default!
```

### Option 2: Using OpenAI API

Set these environment variables:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export OPENAI_MODEL="gpt-4o-mini"  # or gpt-4, gpt-3.5-turbo
```

### Option 3: Using Ollama Fallback Model

If you want to use the original llama3.2:1b model instead of gpt-oss:

```bash
# Set environment variable to use fallback
export USE_FALLBACK_MODEL="true"
```

This will use:
- Host: `http://localhost:11434`
- Model: `llama3.2:1b`

## How It Works

### Message Classification Process

1. **User sends message** → Frontend calls `/api/classify-message`
2. **LLM analyzes message** → Returns structured classification:
   ```json
   {
     "classification": "SIMPLE_TASK",
     "confidence": 0.92,
     "reasoning": "Clear request to create an action item with specific deliverable"
   }
   ```
3. **Thinking steps adapt** → Shows appropriate steps based on classification
4. **Fallback handling** → Uses keyword matching if LLM fails

### Classification Categories

- **BRAIN_DUMP**: Complex messages with multiple ideas/tasks
- **SIMPLE_TASK**: Clear requests to create tasks or action items  
- **SIMPLE_NOTE**: Thoughts, ideas, or information to remember
- **MESSAGE_ANALYSIS**: General questions or requests needing analysis

## GPT-OSS Installation

GPT-OSS is installed as a model within Ollama:

```bash
# Pull the gpt-oss model
ollama pull gpt-oss

# Verify it's installed
ollama list

# Test it directly (optional)
ollama run gpt-oss "Classify this message: Create a task to review reports"
```

## Testing the Classification

1. **Start the system**:
   ```bash
   make up
   ```

2. **Verify GPT-OSS is available** (optional):
   ```bash
   # Check if gpt-oss model is available
   ollama list | grep gpt-oss
   ```

3. **Test different message types**:
   - "Create a task to review quarterly reports" → SIMPLE_TASK
   - "I'm thinking of building a new mobile app" → SIMPLE_NOTE  
   - "Meeting notes: discussed features, schedule interviews, update database" → BRAIN_DUMP

4. **Check browser console** for classification logs:
   ```
   LLM Classification result: {
     classification: "SIMPLE_TASK",
     confidence: 0.89,
     reasoning: "Clear task creation request with specific deliverable"
   }
   ```

## Benefits of LLM Classification

✅ **More Accurate**: Understands context and intent, not just keywords  
✅ **Flexible**: Handles edge cases and nuanced language  
✅ **Reasoning**: Provides explanation for classification decisions  
✅ **Adaptive**: Can be improved with better prompts or models  
✅ **Fallback Safe**: Gracefully degrades to keyword matching if needed  

## Monitoring

- **Browser Console**: Shows classification results and reasoning
- **API Logs**: Shows LLM provider selection and fallback behavior
- **Performance**: Classification adds ~200-500ms to message processing

The system will automatically choose the best available reasoning model and provide intelligent message classification for better thinking step selection.

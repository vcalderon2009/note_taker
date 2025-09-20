# API Reference

This document provides comprehensive documentation for the Note-Taker AI API endpoints.

## Base URL

- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication

Currently, the API uses a simple user-based system. All requests are associated with a default user (ID: 1). Future versions will implement proper authentication.

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": <response_data>,
  "message": "Success",
  "status": 200
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details",
  "status": 400
}
```

## Endpoints

### Conversations

#### Create Conversation
```http
POST /api/conversations
```

**Request Body:**
```json
{
  "title": "Optional conversation title"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "title": "New Conversation",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### List Conversations
```http
GET /api/conversations?limit=50&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of conversations to return (default: 50)
- `offset` (optional): Number of conversations to skip (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "Project Planning",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Conversation
```http
GET /api/conversations/{conversation_id}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Project Planning",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Get Conversation Messages
```http
GET /api/conversations/{conversation_id}/messages?limit=100&offset=0
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 100)
- `offset` (optional): Number of messages to skip (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "conversation_id": 1,
    "role": "user",
    "content": "I need to remember to call John tomorrow",
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "conversation_id": 1,
    "role": "assistant",
    "content": "I've created a task for you to call John tomorrow.",
    "created_at": "2024-01-15T10:30:01Z"
  }
]
```

#### Delete Conversation
```http
DELETE /api/conversations/{conversation_id}
```

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

### Messages

#### Send Message
```http
POST /api/conversations/{conversation_id}/message
```

**Request Body:**
```json
{
  "text": "I need to remember to call John tomorrow about the project",
  "idempotency_key": "optional-unique-key"
}
```

**Headers:**
- `Idempotency-Key` (optional): Unique key to prevent duplicate processing

**Response:**
```json
{
  "message": {
    "id": 2,
    "conversation_id": 1,
    "role": "assistant",
    "content": "I've created a task for you to call John tomorrow about the project.",
    "created_at": "2024-01-15T10:30:01Z"
  },
  "artifacts": {
    "notes": [],
    "tasks": [
      {
        "id": 1,
        "title": "Call John about the project",
        "description": "Follow up on project discussion",
        "status": "todo",
        "due_at": "2024-01-16T09:00:00Z",
        "created_at": "2024-01-15T10:30:01Z"
      }
    ]
  }
}
```

### Notes

#### List Notes
```http
GET /api/notes?limit=50&offset=0&category=all
```

**Query Parameters:**
- `limit` (optional): Number of notes to return (default: 50)
- `offset` (optional): Number of notes to skip (default: 0)
- `category` (optional): Filter by category (default: "all")

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "conversation_id": 1,
    "title": "Meeting Notes - Project Planning",
    "body": "Discussed the new feature requirements...",
    "tags": ["meeting", "project"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Note
```http
GET /api/notes/{note_id}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Meeting Notes - Project Planning",
  "body": "Discussed the new feature requirements...",
  "tags": ["meeting", "project"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Create Note
```http
POST /api/notes
```

**Request Body:**
```json
{
  "title": "Note Title",
  "body": "Note content...",
  "tags": ["tag1", "tag2"],
  "conversation_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Note Title",
  "body": "Note content...",
  "tags": ["tag1", "tag2"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Update Note
```http
PATCH /api/notes/{note_id}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "body": "Updated content...",
  "tags": ["updated", "tags"]
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Updated Title",
  "body": "Updated content...",
  "tags": ["updated", "tags"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### Delete Note
```http
DELETE /api/notes/{note_id}
```

**Response:**
```json
{
  "message": "Note deleted successfully"
}
```

### Tasks

#### List Tasks
```http
GET /api/tasks?limit=50&offset=0&status=all
```

**Query Parameters:**
- `limit` (optional): Number of tasks to return (default: 50)
- `offset` (optional): Number of tasks to skip (default: 0)
- `status` (optional): Filter by status (todo, in_progress, completed, cancelled)

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "conversation_id": 1,
    "title": "Call John about the project",
    "description": "Follow up on project discussion",
    "status": "todo",
    "priority": "medium",
    "due_at": "2024-01-16T09:00:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Task
```http
GET /api/tasks/{task_id}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Call John about the project",
  "description": "Follow up on project discussion",
  "status": "todo",
  "priority": "medium",
  "due_at": "2024-01-16T09:00:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Create Task
```http
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "Task Title",
  "description": "Task description...",
  "status": "todo",
  "priority": "high",
  "due_at": "2024-01-20T17:00:00Z",
  "conversation_id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Task Title",
  "description": "Task description...",
  "status": "todo",
  "priority": "high",
  "due_at": "2024-01-20T17:00:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### Update Task
```http
PATCH /api/tasks/{task_id}
```

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "status": "in_progress",
  "priority": "medium"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "conversation_id": 1,
  "title": "Updated Task Title",
  "description": "Task description...",
  "status": "in_progress",
  "priority": "medium",
  "due_at": "2024-01-20T17:00:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

#### Delete Task
```http
DELETE /api/tasks/{task_id}
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### Classification

#### Classify Message
```http
POST /api/classification/classify
```

**Request Body:**
```json
{
  "message": "I need to remember to call John tomorrow"
}
```

**Response:**
```json
{
  "classification": "task",
  "confidence": 0.95,
  "reasoning": "The message contains a clear action item with a time reference"
}
```

### Health

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "ollama": "healthy",
    "api": "healthy"
  },
  "version": "0.1.0"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Per User**: 100 requests per minute
- **Per IP**: 1000 requests per hour
- **Burst**: 10 requests per second

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## WebSocket Support

Real-time updates are available via WebSocket:

**Connection**: `ws://localhost:8000/ws/{conversation_id}`

**Message Format**:
```json
{
  "type": "message_update",
  "data": {
    "message": { /* message object */ },
    "artifacts": { /* created notes/tasks */ }
  }
}
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @note-taker/api-client
```

```typescript
import { NoteTakerClient } from '@note-taker/api-client';

const client = new NoteTakerClient({
  baseUrl: 'http://localhost:8000',
  apiKey: 'your-api-key'
});

// Send a message
const response = await client.conversations.sendMessage(1, {
  text: "I need to remember to call John tomorrow"
});
```

### Python
```bash
pip install note-taker-api
```

```python
from note_taker_api import NoteTakerClient

client = NoteTakerClient(
    base_url="http://localhost:8000",
    api_key="your-api-key"
)

# Send a message
response = client.conversations.send_message(1, {
    "text": "I need to remember to call John tomorrow"
})
```

## Interactive API Documentation

For interactive API exploration, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Changelog

### v0.1.0 (Current)
- Initial API implementation
- Basic CRUD operations for conversations, messages, notes, and tasks
- Intent classification endpoint
- Health check endpoint
- Rate limiting and basic error handling

### Upcoming Features
- WebSocket support for real-time updates
- Advanced search and filtering
- Bulk operations
- Export/import functionality
- Webhook support

---

For more detailed information about specific endpoints, visit the interactive documentation at `/docs` when running the API server.

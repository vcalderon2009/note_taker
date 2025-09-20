# Performance

This document covers performance optimization, monitoring, and best practices for the Note-Taker AI system.

## Performance Overview

The Note-Taker AI system is designed for high performance and scalability. This document covers optimization strategies, monitoring techniques, and performance best practices.

## Performance Metrics

### Key Performance Indicators (KPIs)

#### Response Time
- **API Response Time**: < 200ms for simple requests
- **AI Processing Time**: < 4s for GPT-4o-class models
- **Database Query Time**: < 50ms for most queries
- **Frontend Load Time**: < 2s for initial page load

#### Throughput
- **Requests per Second**: 100+ concurrent requests
- **Database Connections**: 20+ concurrent connections
- **AI Requests**: 10+ concurrent AI requests
- **WebSocket Connections**: 100+ concurrent connections

#### Resource Utilization
- **CPU Usage**: < 70% under normal load
- **Memory Usage**: < 80% of available memory
- **Disk I/O**: < 1000 IOPS
- **Network Bandwidth**: < 100Mbps

### Performance Targets

#### Latency Targets
- **P50**: < 200ms for API requests
- **P95**: < 500ms for API requests
- **P99**: < 1s for API requests
- **AI Processing**: < 4s for complex requests

#### Throughput Targets
- **Concurrent Users**: 100+ simultaneous users
- **Requests per Minute**: 1000+ requests
- **Database Queries**: 500+ queries per second
- **AI Requests**: 50+ requests per minute

## Frontend Performance

### Next.js Optimization

#### Code Splitting
```typescript
// Dynamic imports for code splitting
const ChatContainer = dynamic(() => import('./ChatContainer'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

// Route-based code splitting
const Dashboard = dynamic(() => import('./Dashboard'));
```

#### Image Optimization
```typescript
// Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### Bundle Optimization
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };
    return config;
  },
};
```

### React Performance

#### Memoization
```typescript
// React.memo for component memoization
const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
  return <div>{message.content}</div>;
});

// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// useCallback for function memoization
const handleClick = useCallback((id: number) => {
  onItemClick(id);
}, [onItemClick]);
```

#### Virtual Scrolling
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedMessageList = ({ messages }: { messages: Message[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={messages.length}
      itemSize={100}
    >
      {Row}
    </List>
  );
};
```

### State Management

#### React Query Optimization
```typescript
// Optimized React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

// Query optimization
const { data: messages } = useQuery({
  queryKey: ['messages', conversationId],
  queryFn: () => fetchMessages(conversationId),
  enabled: !!conversationId,
  select: (data) => data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
});
```

## Backend Performance

### FastAPI Optimization

#### Async/Await
```python
# Async database operations
async def get_messages(conversation_id: int, db: AsyncSession) -> List[Message]:
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()

# Async AI processing
async def process_message(message: str, context: List[Message]) -> ProcessingResult:
    async with aiohttp.ClientSession() as session:
        async with session.post(ai_endpoint, json={"message": message}) as response:
            return await response.json()
```

#### Connection Pooling
```python
# Database connection pooling
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
)
```

#### Caching
```python
# Redis caching
import redis
from functools import wraps

redis_client = redis.Redis(host='redis', port=6379, db=0)

def cache_result(expiry: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expiry, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(expiry=600)
async def get_user_notes(user_id: int) -> List[Note]:
    # Expensive database query
    pass
```

### Database Performance

#### Query Optimization
```python
# Optimized queries with proper indexing
async def get_user_tasks_with_notes(user_id: int, db: AsyncSession):
    query = (
        select(Task)
        .options(joinedload(Task.notes))
        .where(Task.user_id == user_id)
        .order_by(Task.due_at.asc())
    )
    result = await db.execute(query)
    return result.scalars().all()

# Bulk operations
async def create_multiple_notes(notes_data: List[NoteCreate], db: AsyncSession):
    notes = [Note(**note.dict()) for note in notes_data]
    db.add_all(notes)
    await db.commit()
    return notes
```

#### Database Indexing
```sql
-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at);

CREATE INDEX CONCURRENTLY idx_tasks_user_status_due 
ON tasks(user_id, status, due_at);

CREATE INDEX CONCURRENTLY idx_notes_user_created 
ON notes(user_id, created_at);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_tasks_pending 
ON tasks(user_id, due_at) 
WHERE status = 'todo';
```

#### Connection Management
```python
# Database connection management
class DatabaseManager:
    def __init__(self):
        self.engine = create_async_engine(DATABASE_URL)
        self.session_factory = async_sessionmaker(self.engine)
    
    async def get_session(self):
        async with self.session_factory() as session:
            try:
                yield session
            finally:
                await session.close()
```

## AI Performance

### Model Optimization

#### Model Selection
```python
# Model selection based on complexity
async def select_model(message: str, context: List[Message]) -> str:
    complexity = calculate_complexity(message, context)
    
    if complexity < 0.3:
        return "llama3.2:1b"  # Fast, simple tasks
    elif complexity < 0.7:
        return "llama3.2:3b"  # Medium complexity
    else:
        return "gpt-4"  # Complex tasks
```

#### Context Management
```python
# Context window management
async def manage_context(messages: List[Message], max_tokens: int = 4000) -> List[Message]:
    total_tokens = sum(len(msg.content.split()) for msg in messages)
    
    if total_tokens <= max_tokens:
        return messages
    
    # Keep recent messages and important ones
    recent_messages = messages[-10:]  # Last 10 messages
    important_messages = [msg for msg in messages if msg.role == 'system']
    
    return important_messages + recent_messages
```

#### Response Caching
```python
# AI response caching
@cache_result(expiry=3600)  # 1 hour cache
async def get_ai_response(message: str, context: List[Message]) -> str:
    # Expensive AI processing
    pass
```

### AI Provider Optimization

#### Load Balancing
```python
# Multiple AI providers for load balancing
class AIProviderManager:
    def __init__(self):
        self.providers = [
            OllamaProvider(),
            OpenAIProvider(),
            # Add more providers
        ]
        self.current_provider = 0
    
    async def get_response(self, message: str) -> str:
        provider = self.providers[self.current_provider]
        try:
            return await provider.process(message)
        except Exception:
            # Fallback to next provider
            self.current_provider = (self.current_provider + 1) % len(self.providers)
            return await self.get_response(message)
```

#### Request Batching
```python
# Batch AI requests for efficiency
async def batch_ai_requests(requests: List[AIRequest]) -> List[AIResponse]:
    # Group similar requests
    grouped_requests = group_by_similarity(requests)
    
    # Process in batches
    results = []
    for batch in grouped_requests:
        batch_results = await process_batch(batch)
        results.extend(batch_results)
    
    return results
```

## Monitoring and Observability

### Performance Monitoring

#### Application Metrics
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Active database connections')

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    REQUEST_DURATION.observe(time.time() - start_time)
    
    return response
```

#### Database Monitoring
```python
# Database performance monitoring
class DatabaseMonitor:
    def __init__(self):
        self.query_times = []
        self.slow_query_threshold = 1.0  # 1 second
    
    async def monitor_query(self, query_func, *args, **kwargs):
        start_time = time.time()
        result = await query_func(*args, **kwargs)
        duration = time.time() - start_time
        
        self.query_times.append(duration)
        
        if duration > self.slow_query_threshold:
            logger.warning(f"Slow query detected: {duration:.2f}s")
        
        return result
```

### Logging and Tracing

#### Structured Logging
```python
# Structured logging with correlation IDs
import structlog

logger = structlog.get_logger()

async def process_message(message: str, conversation_id: int):
    with structlog.contextvars.bound_contextvars(
        conversation_id=conversation_id,
        message_length=len(message)
    ):
        logger.info("Processing message", message=message[:100])
        
        try:
            result = await ai_provider.process(message)
            logger.info("Message processed successfully", 
                       processing_time=result.processing_time)
            return result
        except Exception as e:
            logger.error("Message processing failed", error=str(e))
            raise
```

#### Distributed Tracing
```python
# OpenTelemetry tracing
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

tracer = trace.get_tracer(__name__)

@app.post("/api/conversations/{conversation_id}/message")
async def send_message(conversation_id: int, message: MessageCreate):
    with tracer.start_as_current_span("send_message") as span:
        span.set_attribute("conversation_id", conversation_id)
        span.set_attribute("message_length", len(message.text))
        
        result = await process_message(message.text, conversation_id)
        
        span.set_attribute("result_type", result.type)
        span.set_attribute("processing_time", result.processing_time)
        
        return result
```

## Performance Testing

### Load Testing

#### API Load Testing
```python
# Locust load testing
from locust import HttpUser, task, between

class NoteTakerUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login or setup
        self.client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "password"
        })
    
    @task(3)
    def send_message(self):
        self.client.post("/api/conversations/1/message", json={
            "text": "Test message for load testing"
        })
    
    @task(1)
    def get_notes(self):
        self.client.get("/api/notes")
    
    @task(1)
    def get_tasks(self):
        self.client.get("/api/tasks")
```

#### Database Load Testing
```python
# Database performance testing
import asyncio
import time

async def test_database_performance():
    start_time = time.time()
    
    # Concurrent database operations
    tasks = []
    for i in range(100):
        task = asyncio.create_task(create_note(f"Test note {i}"))
        tasks.append(task)
    
    results = await asyncio.gather(*tasks)
    
    duration = time.time() - start_time
    print(f"Created 100 notes in {duration:.2f} seconds")
    print(f"Average time per note: {duration/100:.3f} seconds")
```

### Performance Benchmarks

#### Baseline Metrics
```python
# Performance benchmark suite
class PerformanceBenchmark:
    def __init__(self):
        self.metrics = {}
    
    async def benchmark_api_endpoints(self):
        endpoints = [
            ("GET", "/api/health"),
            ("GET", "/api/notes"),
            ("POST", "/api/conversations/1/message"),
            ("GET", "/api/tasks"),
        ]
        
        for method, endpoint in endpoints:
            start_time = time.time()
            # Make request
            duration = time.time() - start_time
            self.metrics[endpoint] = duration
    
    def generate_report(self):
        print("Performance Benchmark Report")
        print("=" * 40)
        for endpoint, duration in self.metrics.items():
            print(f"{endpoint}: {duration:.3f}s")
```

## Optimization Strategies

### Caching Strategies

#### Multi-Level Caching
```python
# Multi-level caching implementation
class CacheManager:
    def __init__(self):
        self.l1_cache = {}  # In-memory cache
        self.l2_cache = redis.Redis()  # Redis cache
        self.l3_cache = DatabaseCache()  # Database cache
    
    async def get(self, key: str):
        # L1 cache (fastest)
        if key in self.l1_cache:
            return self.l1_cache[key]
        
        # L2 cache (Redis)
        value = self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value
            return value
        
        # L3 cache (Database)
        value = await self.l3_cache.get(key)
        if value:
            self.l2_cache.set(key, value, ex=3600)
            self.l1_cache[key] = value
            return value
        
        return None
```

#### Cache Invalidation
```python
# Cache invalidation strategies
class CacheInvalidator:
    def __init__(self, cache_manager: CacheManager):
        self.cache = cache_manager
    
    async def invalidate_user_data(self, user_id: int):
        # Invalidate all user-related cache
        patterns = [
            f"user:{user_id}:*",
            f"conversations:{user_id}:*",
            f"notes:{user_id}:*",
            f"tasks:{user_id}:*"
        ]
        
        for pattern in patterns:
            await self.cache.delete_pattern(pattern)
```

### Database Optimization

#### Query Optimization
```python
# Query optimization techniques
class OptimizedQueries:
    @staticmethod
    async def get_user_dashboard_data(user_id: int, db: AsyncSession):
        # Single query with joins instead of multiple queries
        query = (
            select(
                User.id,
                func.count(Conversation.id).label('conversation_count'),
                func.count(Note.id).label('note_count'),
                func.count(Task.id).label('task_count'),
                func.count(case((Task.status == 'todo', 1))).label('pending_tasks')
            )
            .select_from(User)
            .outerjoin(Conversation, User.id == Conversation.user_id)
            .outerjoin(Note, User.id == Note.user_id)
            .outerjoin(Task, User.id == Task.user_id)
            .where(User.id == user_id)
            .group_by(User.id)
        )
        
        result = await db.execute(query)
        return result.first()
```

#### Connection Pooling
```python
# Advanced connection pooling
from sqlalchemy.pool import QueuePool, NullPool

# Production connection pool
production_engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_timeout=30,
)

# Development connection pool
development_engine = create_async_engine(
    DATABASE_URL,
    poolclass=NullPool,  # No pooling for development
)
```

## Performance Monitoring Dashboard

### Real-time Metrics
```python
# Performance monitoring dashboard
class PerformanceDashboard:
    def __init__(self):
        self.metrics = {
            'response_times': [],
            'error_rates': [],
            'throughput': [],
            'resource_usage': {}
        }
    
    def update_metrics(self, response_time: float, error: bool = False):
        self.metrics['response_times'].append(response_time)
        if error:
            self.metrics['error_rates'].append(1)
        else:
            self.metrics['error_rates'].append(0)
    
    def get_performance_summary(self):
        return {
            'avg_response_time': np.mean(self.metrics['response_times']),
            'p95_response_time': np.percentile(self.metrics['response_times'], 95),
            'error_rate': np.mean(self.metrics['error_rates']),
            'throughput': len(self.metrics['response_times'])
        }
```

---

Performance optimization is an ongoing process that requires continuous monitoring and improvement. This document provides a foundation for implementing and maintaining high performance in the Note-Taker AI system.

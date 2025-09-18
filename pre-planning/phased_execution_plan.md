# Phased Execution Plan: Note‑Taker AI Assistant

## Guiding Principles

- **User-first**: Fast, low-friction capture; clarity over cleverness.
- **Thin slices**: Ship minimal verticals that deliver end-to-end value.
- **Stable interfaces**: Abstract LLMs, tools (MCP), and storage behind clean boundaries to enable iteration.
- **Observability & safety**: Measure quality, latency, and failures from day 1; protect user data.
- **Bias to simplicity**: Prefer boring, reliable tech for core paths; introduce complexity only when it pays for itself.

## System Architecture (High-Level)

- **Frontend (Next.js + Tailwind)**
  - Chat UI, sidebar (Notes, Tasks), Dashboard (Phase 2+), Thinking UI.
  - State: React Query for server-state; lightweight local UI state.

- **Backend API (FastAPI)**
  - REST endpoints for notes, tasks, conversations, and orchestration.
  - Service layers: `orchestrator_service`, `notes_service`, `tasks_service`, `memory_service`.
  - Adapters: `llm_provider` (OpenAI/Ollama), `memory_adapter` (Mem0/vector DB), `tool_adapter` (MCP).

- **Data Stores**
  - PostgreSQL: users, conversations, messages, notes, tasks, tool_runs, audit_logs.
  - Vector DB (Phase 2): embeddings for long‑term memory (Mem0 or Chroma/Pinecone).

- **LLM & Tools**
  - Pluggable LLM provider with retry/backoff and cost/latency tracking.
  - Tools via MCP interface (introduced in a later phase; calendar deprioritized).

- **Infra**
  - Dockerized services + `docker-compose` for local.
  - CI (lint/test/build), CD to a single environment initially; add staging in Phase 2.

## Data Model (Initial)

- `users(id, email, created_at)`
- `conversations(id, user_id, title, created_at)`
- `messages(id, conversation_id, role, content, tokens_in, tokens_out, latency_ms, created_at)`
- `notes(id, user_id, conversation_id, title, body, tags[], created_at, updated_at)`
- `tasks(id, user_id, conversation_id, title, description, due_at, status, priority, created_at, updated_at)`
- `tool_runs(id, conversation_id, tool_name, input_json, output_json, status, created_at)`
- `audit_logs(id, user_id, action, entity_type, entity_id, metadata_json, created_at)`

Indexes on foreign keys and `tasks(due_at,status)`, `notes(created_at)`.

## Core APIs (Initial)

- `POST /api/conversations` → create
- `GET /api/conversations/:id/messages` → list
- `POST /api/conversations/:id/message` → send user message → orchestrate → returns assistant message + artifacts (created notes/tasks)
- `GET /api/notes` / `POST /api/notes`
- `GET /api/tasks` / `POST /api/tasks` / `PATCH /api/tasks/:id`

## Orchestrator (Phase 1 baseline)

1. Accepts user message + minimal context (last N messages).
2. Calls LLM with a constrained system prompt to classify intent: note | task | brain_dump | chit_chat.
3. For note/task/brain_dump: produce normalized structured output.
4. Persist entities; return assistant reply + created objects.
5. Summarize conversation title opportunistically (background).

## Phase 0: Foundations (Week 0–1)

- Repo scaffolding, dev containers, Makefile/Nox tasks.
- Pre-commit, linters (ruff/black for Python, eslint/prettier for JS), type checking (mypy/pyright as applicable).
- `docker-compose` with services: web (Next.js), api (FastAPI), postgres, adminer; seed scripts.
- Secrets management: `.env` templates; local-only keys.
- CI: run linters/tests; build images.

Deliverables:
- App boots locally: open chat UI, API health check, DB migrations runnable.

## Phase 1: MVP – Conversational Capture & Organization (Weeks 2–4)

Objectives:
- Convert conversational input into notes/tasks; organize brain dumps; short-term memory across the current conversation; persist and display.

Scope:
- Frontend
  - Chat UI with message stream, loading indicators, error toasts.
  - Sidebar: tabs for Tasks and Notes with simple lists and detail modals.
  - Minimal Thinking UI: spinner + collapsible reasoning stub (static layout).
  - React Query clients for `messages`, `notes`, `tasks`.
- Backend
  - DB schema and migrations for models above.
  - LLM provider abstraction with OpenAI and Ollama drivers (env selectable).
  - Orchestrator v1: intent classification + normalization.
  - Services: `notes_service.create_from_text`, `tasks_service.create_from_text`.
  - Short-term memory: windowed context of last K messages; optional summarizer for long threads into `messages(role=system, content=summary)`.
  - Basic rate limiting per user (e.g., sliding window in Redis or in-DB conservative cap).
  - Telemetry: request/response logs, token and latency metrics.

APIs:
- `POST /api/conversations/:id/message` executes orchestration and persists outputs.
- CRUD for notes/tasks used by sidebar views.

Acceptance Criteria:
- User can send a brain dump; receives structured note with title/sections saved and visible.
- User can issue a task; it is saved, visible, and editable.
- Conversation remembers last messages for follow-ups in the same thread.
- P50 E2E latency under 4s with GPT-4o-class model; under 8s with local model.

Out of Scope:
- External integrations;
- Long-term memory store;
- Multi-agent.

## Phase 2: Intelligent Assistant – Memory & Dashboard (Weeks 5–8)

Objectives:
- Introduce long-term memory; richer task lifecycle; Dashboard; functional Thinking UI. Defer external integrations.

Scope:
- Frontend
  - Dashboard: upcoming tasks (due soon), recent notes, quick actions.
  - Thinking UI: expandable steps populated from `tool_runs` and orchestrator traces.
- Backend
  - Memory adapter: integrate Mem0 (preferred) or vector DB; embedding pipeline with privacy filters.
  - Conversation memory: periodic summarization; retrieval of relevant past summaries by semantic search.
  - MCP interface: define internal `Tool` protocol for future integrations (no OAuth in this phase).
  - Task lifecycle: statuses (todo, in_progress, blocked, done), reminders, due dates; conversational updates.
  - Authorization: per-user data isolation, tightened rate limits, abuse safeguards.

APIs:
- Memory endpoints for admin/debug only (guarded).

Acceptance Criteria:
- Agent recalls action items from a prior conversation when asked a week later.
- Dashboard shows unified view of tasks and recent notes.

Risks & Mitigations:
- Memory hallucination → use conservative retrieval thresholds; show provenance links.

## Phase 3: Multi‑Agent – Specialization & Proactivity (Weeks 9–12)

Objectives:
- Decompose orchestrator into specialized agents and enable A2A; add internet tool; proactive suggestions.

Scope:
- Agents: `NotesAgent`, `TaskAgent`; `OrchestratorAgent` delegates via explicit tool contracts.
- A2A protocol: message envelope with schema version, capabilities, and routing rules; conflict resolution and timeouts.
- Internet tool (optional): controlled web search with domain allowlist and summarization budget.
- Proactivity: background jobs analyze tasks/notes to emit suggestions; user approval workflow.

Acceptance Criteria:
- Complex request (“Summarize Q3 Launch notes and create tasks”) completes via agent collaboration.
- Proactive suggestion feed appears with explainable rationale and one-click apply.

## Cross‑Cutting Concerns

- Security & Privacy
  - Store minimal PII; encrypt at rest (DB) and in transit (TLS); rotate secrets.
  - Redaction pipeline for embeddings; configurable data retention.
  - Content safety checks for tool outputs; guardrails on any external write operations.

- Observability
  - Structured logs with correlation IDs; OpenTelemetry traces across frontend → backend → LLM/tool calls.
  - Use Langfuse for LLM- and tool-specific tracing, spans, evaluations, and prompt version tracking.
  - Metrics: request rate, error rate, P50/P95 latency, token usage, cost per user/session, tool success rates.

- Testing Strategy
  - Unit tests for services and adapters.
  - Contract tests for tool interfaces (MCP) and LLM adapters with fixtures.
  - E2E tests: happy-path chat flows; dashboard.
  - Load tests on `POST /message` path; chaos testing for tool timeouts.

- Performance Budgets
  - P50 chat round-trip ≤ 4s; P95 ≤ 9s.
  - Cold start ≤ 1.5s API; DB queries ≤ 150ms P95.

- Deployment
  - Environments: dev (compose), staging (single VM/container host), prod.
  - CI/CD: run tests + build images; gated manual promotion; migrations with zero-downtime tooling.

## Dependencies & Sequencing

1. Phase 0 enables Phase 1 (shared infra, CI, DB).
2. Phase 1 delivers end-to-end capture; its orchestrator and adapters are the seams for Phase 2/3.
3. Phase 2 depends on stable user and conversation models; introduces memory and first tool via MCP.
4. Phase 3 depends on MCP contracts and memory to coordinate specialized agents.

Critical Path:
- Schema → Orchestrator v1 → Chat UI → Notes/Tasks CRUD → Memory adapter → Agents (optional external tools later).

## Milestones & Success Metrics

- Phase 1
  - Ship MVP to internal users; collect feedback on organization quality.
  - Metrics: DAU, notes/tasks per session, P50 latency, defect rate.

- Phase 2
  - Retention W1/W4 improve ≥ 15%; memory-assisted answers rated useful ≥ 70%.

- Phase 3
  - Multi-step task completion success ≥ 80%; proactive suggestion acceptance ≥ 30%.
  - System reliability: 99% success for tool orchestration; P95 latency within budget.

## Implementation Checklist (Condensed)

- Phase 0
  - Repo, compose, CI, lint/test, migrations, health endpoints.
- Phase 1
  - Schemas/migrations; LLM adapter; orchestrator v1; chat UI; sidebar; telemetry; rate limiting.
- Phase 2
  - Memory adapter + summaries/RAG; Dashboard; Thinking UI wired to traces; task lifecycle.
- Phase 3
  - Agent decomposition; A2A protocol; internet tool; proactivity jobs; guardrails and explainability.

## Known Risks

- Scope creep on UI polish → enforce acceptance criteria per phase.
- Vendor lock-in for memory → keep adapter; export/import utilities.
- Costs for LLMs → support Ollama/offline mode; caching; batch summarization.

## Big-Picture Validation

- The architecture maintains clean seams: LLM provider, memory, and tools are pluggable behind adapters. This supports iterative upgrades (e.g., swapping memory or adding tools) without cross-cutting rewrites.
- Phases build vertical slices: each phase yields a usable product and collects telemetry to guide the next.
- Data model covers core entities and enables later features (tool runs, auditability, and traces for Thinking UI) without premature complexity.
- Security, observability, and testing are integrated early to reduce downstream risk.

## Technical Decisions (Non‑Negotiables)

- Idempotency: All mutating endpoints (notably `POST /api/conversations/:id/message`) accept an `Idempotency-Key` header and deduplicate server-side.
- Structured Output Contracts: Orchestrator outputs must conform to JSON Schemas (note, task, brain_dump) with schema versioning; validate server-side.
- Prompt & Model Versioning: Persist `prompt_version`, `model_id`, and runtime parameters on each LLM/tool call; include in traces and `messages` metadata.
- Circuit Breakers & Timeouts: Bound LLM/tool call time; retries with jitter; fallback behaviors; expose degraded-mode flags in responses.
- Background Jobs: Use a lightweight job runner (FastAPI BackgroundTasks initially; upgrade to RQ/Celery if needed) for summarization, embeddings, and proactivity.
- Access Control & Scopes: Narrow OAuth scopes; encrypt refresh tokens; key rotation schedule documented.
- Memory Privacy: PII redaction before embeddings; per-user namespaces; configurable TTL and hard-delete.
- Rate Limits & Quotas: User/session caps and cost budgets; graceful downgrade to smaller models or cached summaries when exceeded.
- Tool Safety: Confirmation prompts for destructive actions in early phases; later allow auto-apply with undo and audit logs.

## Observability with Langfuse

- Rationale: Purpose-built LLM observability (traces/spans, prompt tracking, evals) complements OpenTelemetry. Self-hosting aligns with privacy.
- Deployment (self-host via Docker):
  - Services: Langfuse Web + Worker, PostgreSQL, ClickHouse (analytics), Redis/Valkey (cache), and optional S3/MinIO for blobs.
  - Local: Add a `docker-compose.observability.yml` that runs Langfuse stack alongside app services.
  - Production: Single VM or managed containers initially; later Helm/Kubernetes.
- SDK/Integration:
  - Backend (FastAPI/Python): Use Langfuse Python SDK to create traces around orchestrator, LLM calls, memory retrieval, and MCP tool calls.
  - Frontend (Next.js/Node): Use Langfuse JavaScript SDK for client-side spans (lightweight) or proxy via API for server-side spans to avoid leaking keys.
  - OpenTelemetry: Optionally export OTEL traces to Langfuse OTLP HTTP endpoint; prefer HTTP/protobuf over gRPC as recommended.
- Instrumentation Plan:
  - Trace per user request to `POST /message`; spans for prompt construction, LLM call, schema validation, persistence, and each tool call.
  - Attach metadata: `conversation_id`, `user_id` (hashed), `prompt_version`, `model_id`, tokens, latency, cost, and idempotency key.
  - Power Thinking UI from Langfuse trace data (subset) via a backend endpoint that reads spans and redacts sensitive fields.
- Phase Alignment:
  - Phase 0: Stand up Langfuse in compose; add minimal SDK and trace the orchestrator path.
  - Phase 1: Expand tracing to notes/tasks services; token/latency metrics dashboards.
  - Phase 2: Tool and memory spans; evaluations on memory retrieval quality; dashboard panels.
  - Phase 3: Agent-to-agent spans with correlation IDs and deadlines; suggestion quality evals.



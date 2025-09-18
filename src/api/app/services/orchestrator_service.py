from __future__ import annotations

import json

from sqlalchemy.orm import Session
from datetime import datetime

from ..adapters.llm_provider import LLMMessage, OllamaProvider
from ..models.orm import Note, Task, Message
from ..models.schemas import OrchestratorNoteResult, OrchestratorTaskResult, OrchestratorBrainDumpResult
from ..config.settings import settings
from ..prompts.manager import get_system_prompt, get_temperature, get_fallback_config
from ..telemetry.logger import telemetry


class OrchestratorService:
    def __init__(self, provider: OllamaProvider | None = None, model: str | None = None):
        self.provider = provider or OllamaProvider(host=settings.ollama_host)
        self.model = model or settings.ollama_model
        self.context_window_size = 10  # Number of recent messages to include
        self.max_context_tokens = 4000  # Approximate token limit for context
        self.brain_dump_threshold = 100  # Character threshold for brain dump detection

    def _get_conversation_context(self, db: Session, conversation_id: int) -> list[LLMMessage]:
        """Retrieve recent conversation messages for context."""
        # Get recent messages (excluding the current user message we just added)
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(self.context_window_size)
            .all()
        )
        
        # Convert to LLM messages in chronological order (oldest first)
        context_messages = []
        for msg in reversed(recent_messages):
            # Skip the current user message we just added
            if msg.role == "user" and len(context_messages) == 0:
                continue
                
            context_messages.append(
                LLMMessage(
                    role=msg.role,
                    content=msg.content
                )
            )
        
        # Rough token estimation and truncation
        total_chars = sum(len(msg.content) for msg in context_messages)
        if total_chars > self.max_context_tokens:
            # Keep only the most recent messages that fit
            truncated_messages = []
            current_chars = 0
            for msg in reversed(context_messages):
                if current_chars + len(msg.content) > self.max_context_tokens:
                    break
                truncated_messages.insert(0, msg)
                current_chars += len(msg.content)
            context_messages = truncated_messages
        
        return context_messages

    def _validate_classification(self, text: str, llm_result: dict) -> dict:
        """Light validation for edge cases - 7B model is generally very accurate."""
        # With the 7B model, we mostly trust the LLM's classification
        # Only apply minimal fallback for very obvious cases
        fallback_config = get_fallback_config('orchestrator')
        task_keywords = fallback_config.get('task_keywords', [])
        
        lower_text = text.lower()
        
        # Only override if we find very explicit task indicators and LLM said note
        explicit_task_indicators = ['task:', 'todo:', 'action:', 'need to', 'must']
        has_explicit_indicators = any(keyword in lower_text for keyword in explicit_task_indicators)
        
        if (llm_result.get("type") == "note" and has_explicit_indicators):
            # Convert note to task for very explicit cases
            note_data = llm_result.get("note", {})
            title = note_data.get("title", text[:120])
            return {
                "type": "task",
                "task": {
                    "title": title,
                    "description": note_data.get("body", text),
                    "due_at": None,
                    "status": "todo",
                    "priority": 3
                }
            }
        
        # Trust the 7B model's judgment in all other cases
        return llm_result
    
    def _is_brain_dump(self, text: str) -> bool:
        """Detect if the input is a brain dump requiring multi-item processing."""
        fallback_config = get_fallback_config('orchestrator')
        brain_dump_config = fallback_config.get('brain_dump_indicators', {})
        
        action_keywords = brain_dump_config.get('action_keywords', [])
        organizational_keywords = brain_dump_config.get('organizational_keywords', [])
        
        # Heuristics for brain dump detection
        indicators = [
            len(text) > self.brain_dump_threshold,  # Length threshold
            text.count('\n') > 2,  # Multiple lines
            text.count('.') > 3,  # Multiple sentences
            text.count(',') > 4,  # Multiple comma-separated items
            any(keyword in text.lower() for keyword in action_keywords),  # Action keywords
            len([word for word in text.split() if word.lower() in organizational_keywords]) > 2  # Multiple organizational keywords
        ]
        
        # Return True if multiple indicators are present
        return sum(indicators) >= 2

    def _process_brain_dump(self, db: Session, user_id: int, conversation_id: int, text: str, context_messages: list[LLMMessage], request_id: str = None) -> dict:
        """Process a brain dump into multiple organized notes and tasks."""
        system_prompt = get_system_prompt('orchestrator', 'brain_dump')
        temperature = get_temperature('orchestrator', 'brain_dump', default=0.3)
        
        system = LLMMessage(
            role="system",
            content=system_prompt
        )
        
        # Build message sequence with context
        messages = [system]
        messages.extend(context_messages)
        messages.append(LLMMessage(role="user", content=text))
        
        try:
            # Track LLM call with telemetry
            llm_start_time = datetime.now()
            resp = self.provider.generate(self.model, messages, temperature=temperature)
            llm_end_time = datetime.now()
            
            # Log LLM call metrics
            llm_duration_ms = int((llm_end_time - llm_start_time).total_seconds() * 1000)
            
            # Estimate token usage (rough approximation)
            input_text = " ".join([msg.content for msg in messages])
            prompt_tokens = len(input_text.split()) * 1.3  # Rough estimation
            completion_tokens = len(resp.content.split()) * 1.3
            total_tokens = prompt_tokens + completion_tokens
            
            telemetry.log_llm_call(
                request_id=request_id or "unknown",
                model=self.model,
                provider="ollama",
                prompt_tokens=int(prompt_tokens),
                completion_tokens=int(completion_tokens),
                total_tokens=int(total_tokens),
                duration_ms=llm_duration_ms,
                temperature=temperature,
                success=True
            )
            
            # Extract JSON from markdown code blocks if present
            response_content = resp.content.strip()
            
            # Remove markdown code block formatting
            if response_content.startswith('```json'):
                response_content = response_content[7:]  # Remove ```json
            if response_content.startswith('```'):
                response_content = response_content[3:]  # Remove ```
            if response_content.endswith('```'):
                response_content = response_content[:-3]  # Remove trailing ```
            
            response_content = response_content.strip()
            
            # Try to clean up the JSON response if it's truncated
            if not response_content.endswith('}'):
                # Try to close the JSON if it's incomplete
                if response_content.endswith(']'):
                    response_content += '}'
                elif response_content.endswith('"'):
                    response_content += '}]}'
                else:
                    response_content += ']}'
            
            data = json.loads(response_content)
            
            if data.get("type") != "brain_dump" or not isinstance(data.get("items"), list):
                # Fallback to simple processing
                return self._process_simple_message(db, user_id, conversation_id, text, context_messages)
            
            notes = []
            tasks = []
            
            # Process each item in the brain dump
            for item in data["items"]:
                if not isinstance(item, dict):
                    continue
                    
                item_type = item.get("type")
                title = str(item.get("title", "Untitled"))
                
                if item_type == "task":
                    task = Task(
                        user_id=user_id,
                        conversation_id=conversation_id,
                        title=title,
                        description=item.get("description"),
                        status="todo",
                        priority=item.get("priority")
                    )
                    db.add(task)
                    db.flush()
                    db.refresh(task)
                    tasks.append(task)
                    
                else:  # Default to note
                    note = Note(
                        user_id=user_id,
                        conversation_id=conversation_id,
                        title=title,
                        body=str(item.get("body", item.get("title", ""))),
                        tags=None  # Simplified for now
                    )
                    db.add(note)
                    db.flush()
                    db.refresh(note)
                    notes.append(note)
            
            # Create summary response message
            summary = data.get("summary", f"Organized {len(notes + tasks)} items from your brain dump")
            items_summary = []
            if notes:
                items_summary.append(f"{len(notes)} note{'s' if len(notes) != 1 else ''}")
            if tasks:
                items_summary.append(f"{len(tasks)} task{'s' if len(tasks) != 1 else ''}")
            
            assistant_content = f"{summary}. Created: {', '.join(items_summary)}."
            
            assistant_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=assistant_content,
                created_at=datetime.now()
            )
            db.add(assistant_message)
            db.commit()
            
            return {
                "type": "brain_dump",
                "summary": summary,
                "notes": notes,
                "tasks": tasks,
                "total_items": len(notes) + len(tasks)
            }
            
        except Exception as e:
            # Fallback to simple processing if brain dump parsing fails
            print(f"DEBUG: Brain dump processing failed with exception: {e}")
            import traceback
            traceback.print_exc()
            return self._process_simple_message(db, user_id, conversation_id, text, context_messages)

    def _process_simple_message(self, db: Session, user_id: int, conversation_id: int, text: str, context_messages: list[LLMMessage], request_id: str = None) -> dict:
        """Process a simple message (single note or task) - extracted from original logic."""
        system_prompt = get_system_prompt('orchestrator', 'simple_message')
        temperature = get_temperature('orchestrator', 'simple_message', default=0.1)
        
        system = LLMMessage(
            role="system",
            content=system_prompt
        )
        
        # Build message sequence: system + context + current user message
        messages = [system]
        messages.extend(context_messages)
        messages.append(LLMMessage(role="user", content=text))
        
        start_time = datetime.now()
        try:
            resp = self.provider.generate(self.model, messages, temperature=temperature)
            end_time = datetime.now()
            latency_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Log LLM call metrics
            input_text = " ".join([msg.content for msg in messages])
            prompt_tokens = len(input_text.split()) * 1.3  # Rough estimation
            completion_tokens = len(resp.content.split()) * 1.3
            total_tokens = prompt_tokens + completion_tokens
            
            telemetry.log_llm_call(
                request_id=request_id or "unknown",
                model=self.model,
                provider="ollama",
                prompt_tokens=int(prompt_tokens),
                completion_tokens=int(completion_tokens),
                total_tokens=int(total_tokens),
                duration_ms=latency_ms,
                temperature=temperature,
                success=True
            )
            data = json.loads(resp.content)
            
            # With the 7B model, we trust the LLM classification more
            # Keep minimal validation for edge cases
            data = self._validate_classification(text, data)
            
            if data.get("type") == "task" and isinstance(data.get("task"), dict):
                payload = data["task"]
                task = Task(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    title=str(payload.get("title") or text[:120]),
                    description=payload.get("description"),
                    due_at=None,  # parse ISO if provided later
                    status=str(payload.get("status") or "todo"),
                    priority=payload.get("priority"),
                )
                db.add(task)
                db.flush()
                db.refresh(task)
                
                # Store assistant response
                assistant_content = f"Created task: {task.title}"
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                    latency_ms=latency_ms,
                    created_at=end_time
                )
                db.add(assistant_message)
                db.commit()
                
                return {"type": "task", "task": task}
            else:
                payload = data.get("note", {}) if isinstance(data, dict) else {}
                note = Note(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    title=str(payload.get("title") or (text.split("\n", 1)[0][:80] or "Note")),
                    body=str(payload.get("body") or text),
                    tags=payload.get("tags"),
                )
                db.add(note)
                db.flush()
                db.refresh(note)
                
                # Store assistant response
                assistant_content = f"Created note: {note.title}"
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                    latency_ms=latency_ms,
                    created_at=end_time
                )
                db.add(assistant_message)
                db.commit()
                
                return {"type": "note", "note": note}
                
        except Exception:
            # Fallback heuristic for simple processing
            fallback_config = get_fallback_config('orchestrator')
            task_keywords = fallback_config.get('task_keywords', [])
            
            lower = text.lower()
            if any(k in lower for k in task_keywords):
                title = text.split(":", 1)[-1].strip() or text[:120]
                task = Task(user_id=user_id, conversation_id=conversation_id, title=title)
                db.add(task)
                db.flush()
                db.refresh(task)
                
                assistant_content = f"Created task: {task.title}"
                assistant_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=assistant_content,
                    created_at=datetime.now()
                )
                db.add(assistant_message)
                db.commit()
                
                return {"type": "task", "task": task}
                
            title = text.split("\n", 1)[0][:80] or "Note"
            note = Note(user_id=user_id, conversation_id=conversation_id, title=title, body=text)
            db.add(note)
            db.flush()
            db.refresh(note)
            
            assistant_content = f"Created note: {note.title}"
            assistant_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=assistant_content,
                created_at=datetime.now()
            )
            db.add(assistant_message)
            db.commit()
            
            return {"type": "note", "note": note}

    def handle_message(self, db: Session, user_id: int, conversation_id: int, text: str, request_id: str = None) -> dict:
        start_time = datetime.now()
        
        # Store the user message first
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=text,
            created_at=start_time
        )
        db.add(user_message)
        db.flush()
        
        # Log user activity
        telemetry.log_user_activity(
            user_id=str(user_id),
            action="send_message",
            resource_type="message",
            resource_id=str(user_message.id),
            metadata={"conversation_id": conversation_id, "message_length": len(text)}
        )
        
        # Get conversation context for better understanding
        context_messages = self._get_conversation_context(db, conversation_id)
        
        # Check if this is a brain dump requiring multi-item processing
        is_brain_dump = self._is_brain_dump(text)
        input_type = "brain_dump" if is_brain_dump else "simple_message"
        
        try:
            if is_brain_dump:
                result = self._process_brain_dump(db, user_id, conversation_id, text, context_messages, request_id)
            else:
                result = self._process_simple_message(db, user_id, conversation_id, text, context_messages, request_id)
            
            # Calculate processing time and log success
            end_time = datetime.now()
            processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Determine output type and items created
            output_type = result.get("type", "unknown")
            items_created = 1
            if output_type == "brain_dump":
                items_created = result.get("total_items", 0)
            
            telemetry.log_orchestrator_result(
                request_id=request_id or "unknown",
                user_id=str(user_id),
                input_type=input_type,
                output_type=output_type,
                items_created=items_created,
                processing_time_ms=processing_time_ms,
                success=True
            )
            
            return result
            
        except Exception as e:
            # Log error
            end_time = datetime.now()
            processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            telemetry.log_orchestrator_result(
                request_id=request_id or "unknown",
                user_id=str(user_id),
                input_type=input_type,
                output_type="error",
                items_created=0,
                processing_time_ms=processing_time_ms,
                success=False,
                error=str(e)
            )
            raise

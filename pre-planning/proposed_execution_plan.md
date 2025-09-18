# **Product Plan: Note-Taker AI Assistant**

## **1\. Vision & Executive Summary**

To create an intelligent, conversational AI assistant that seamlessly integrates into a user's daily workflow, acting as a second brain to capture, organize, and act upon their thoughts, tasks, and plans. The application will transform unstructured conversational input into structured data (notes, tasks, calendar events), leveraging both short-term and long-term memory to provide contextually aware and personalized assistance.

**Value Proposition:** We're not just building a note-taker; we're building a proactive assistant that understands you, remembers your context, and reduces the mental overhead of daily planning and organization.

## **2\. Core User Problems & Target Audience**

**Problems to Solve:**

* **Cognitive Load:** Users struggle to keep track of fleeting ideas, action items from conversations, and mental to-do lists.  
* **Friction in Organization:** The effort required to switch between different apps (notes, calendar, to-do list) and manually organize information is a significant barrier to productivity.  
* **Lost Context:** Standard productivity tools lack memory. They don't remember past conversations or the context behind a task, forcing the user to constantly re-explain.

**Target Audience:**

* **Primary:** Knowledge workers, students, entrepreneurs, and creatives who juggle multiple projects and need a streamlined way to manage information.  
* **Secondary:** Anyone looking for a more natural, conversational way to interact with their digital productivity tools.

## **3\. Phased Rollout Strategy**

This project will be built in three distinct phases to ensure we can gather user feedback early, manage technical complexity, and build a robust foundation.

### **Phase 1: The MVP \- Conversational Capture & Organization**

**Goal:** Validate the core interaction model: converting a conversational "brain dump" into organized notes and tasks.

**Core Features:**

1. **Conversational Interface:** A clean, chat-like UI where the user can talk to the assistant.  
2. **Intent Recognition Engine:** A single, primary agent that can differentiate between:  
   * A simple note.  
   * A task (e.g., "remind me to call John").  
   * A "brain dump" (a larger block of unstructured text).  
3. **Note & Task Persistence:**  
   * Store notes and tasks in a simple database.  
   * Display them in a sidebar, categorized by type (e.g., "Tasks," "General Notes").  
4. **Brain Dump Organizer:** For longer inputs, the agent organizes the text into a structured note with a title and clear sections.  
5. **Basic Short-Term Memory:** The agent remembers the immediate context of the current conversation.

**Tech Focus for Phase 1:**

* **Frontend:** Next.js for a responsive UI.  
* **Backend:** FastAPI for the API layer.  
* **AI Core:** A single, powerful LLM (OpenAI or a fine-tuned Ollama model) acting as the main reasoning engine.  
* **Database:** A standard relational database (e.g., PostgreSQL) for initial note and task storage.

**Success Metrics:**

* Daily Active Users (DAU).  
* Number of notes/tasks created per session.  
* User feedback on the quality of brain dump organization.

### **Phase 2: The Intelligent Assistant \- Integration & Memory**

**Goal:** Evolve from a simple capture tool to a proactive assistant by integrating with external services and implementing long-term memory.

**Core Features:**

1. **Google Calendar Integration (MCP):**  
   * The agent can access the user's calendar as a "tool" via an MCP.  
   * **User Story:** "When I say 'schedule a meeting with Jane for tomorrow at 2 PM to discuss the project,' the assistant creates the event on my Google Calendar."  
2. **Advanced Task Management:**  
   * Update, mark as complete, and delete tasks through conversation.  
   * Set deadlines and reminders.  
3. **Long-Term Memory Implementation:**  
   * Integrate a memory solution (like Mem0 or a custom vector database) to store conversation summaries.  
   * The agent can now recall information from past conversations (e.g., "What were the action items from my chat last week about the marketing plan?").  
4. **Dashboard View:** A dedicated tab providing a high-level overview of pending tasks, upcoming events, and recent notes.  
5. **"Thinking" Process UI:** Implement the UI element that shows the agent's reasoning steps, which can be expanded or collapsed.

**Tech Focus for Phase 2:**

* **AI Core:** Introduce the concept of a primary **Orchestrator Agent** that uses **Tools** (MCPs).  
* **Tools/MCPs:** Build the first MCP for Google Calendar API.  
* **Memory:** Integrate Mem0 or a vector DB like Pinecone/ChromaDB.

**Success Metrics:**

* Percentage of users connecting their Google Calendar.  
* User retention rate (Week 1, Week 4).  
* Qualitative feedback on the usefulness of long-term memory.

### **Phase 3: The Multi-Agent System \- Specialization & Proactivity**

**Goal:** Scale the system's intelligence by introducing specialized agents that can collaborate, enabling more complex and proactive workflows.

**Core Features:**

1. **Specialized Agents:** Decompose the single orchestrator into multiple, specialized agents:  
   * **TaskAgent:** Manages all to-do list interactions.  
   * **CalendarAgent:** Manages all scheduling.  
   * **NotesAgent:** Manages note-taking and knowledge organization.  
2. **Agent-to-Agent (A2A) Communication:**  
   * Enable agents to talk to each other to fulfill complex requests.  
   * **User Story:** "I just finished my meeting about the 'Q3 Launch.' Can you summarize my notes, create tasks for the action items we discussed, and schedule a follow-up for next Tuesday?"  
   * *Flow:* The Orchestrator passes this to the NotesAgent to summarize. The NotesAgent extracts action items and passes them to the TaskAgent. The Orchestrator then instructs the CalendarAgent to schedule the follow-up.  
3. **Internet Access:** Allow agents to access the internet for real-time information to enrich notes and tasks.  
4. **Proactive Suggestions:** The system can now analyze your notes, tasks, and calendar to provide proactive suggestions (e.g., "You have a meeting with 'Client X' tomorrow. Here are your notes from the last time you spoke.").

**Tech Focus for Phase 3:**

* **AI Core:** Implement a full multi-agent framework (e.g., using a library like LangGraph or building a custom A2A protocol).  
* **Tools/MCPs:** Expand the library of tools each agent can use.

**Success Metrics:**

* Task completion rate for complex, multi-step requests.  
* User acceptance rate of proactive suggestions.  
* System latency and reliability.

## **4\. Proposed Technical Architecture**

**Frontend:**

* **Framework:** Next.js  
* **Styling:** Tailwind CSS  
* **State Management:** Zustand or React Query

**Backend:**

* **Framework:** FastAPI (Python)  
* **Database:** PostgreSQL (for structured data) & a Vector Database (for memory/embeddings).  
* **Authentication:** OAuth for Google Calendar integration.

**AI / Agent Core:**

* **Orchestrator:** The central logic that receives user input and routes it to the appropriate tool or agent.  
* **LLM Provider:** OpenAI (for performance) or Ollama (for flexibility/cost). This should be a pluggable component.  
* **Memory:** Mem0 for managed memory, or a self-hosted ChromaDB/Weaviate instance.  
* **Tool Interface (MCP):** A standardized internal API that defines how agents can interact with tools like "get\_calendar\_events" or "create\_task". This decouples the agent's logic from the tool's implementation.

**Deployment & Infrastructure:**

* **Containerization:** All services (Next.js frontend, FastAPI backend, databases) will be containerized using Docker. This ensures a consistent and reproducible environment for development, testing, and production.  
* **Orchestration:** A docker-compose file will be used for local development to manage all services. For production, a cloud-based container orchestration service (e.g., Kubernetes, AWS ECS) will be considered for scalability.
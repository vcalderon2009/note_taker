# Note-Taker

## Main Description

This application is a virtual AI assistant that acts as a:
- Note-taker
- Task Summarizer
- connects to Google calendar and creates new events when necessary
- Has built-in conversations (i.e. short and long-term memory)
- Organize brain dumps into organized notes and sections.

The UI is chat-like. The user is able to "talk" to the AI assistant and the assistant will reason as to what kind of information the user is providing, while also able to have a conversation about the conversation and past conversations.

Some of the featues include:
- Remember previous interactions / conversations
- Able to retrieve tasks and reason about them.
- Able to retrieve old reminders
- Able to create new reminders based on new input from the user.
- Update current reminders and tasks based on ongoing conversation with the user.
- Also have access to internet via an LLM
- The agent will be able to access "tools" via MCPS:
    - The tools may include:
        - Task MCP
        - Reminder MCP
    - Have the two agents talk to each other via A2A protocol

The UI should also show:
- Have a sidebar showing the different "sections" (e.g. reminders, tasks, brain dump, etc.)
- A tab for a dashboard with a general overview of tasks, reminders, brain dumps, etc.
- The main / opening page will be the Chat interface with the AI agent
- As the agent "thinks", the UI will show the "thinking" process or steps being taken by the agent, and once it finishes and returns the answer, those will be in a collapsed drop-down menu (similar to how Google's Gemini handles it.)
- The UI should be fast, responsive, nice-looking app.
    - The app should also be modular and compartamentalized.

## Tech stack

The tech stack could include the following:
- Python
- NextJS or Streamlit
- FastAPI
- Mem0 for memory
- OpenAI or Ollama
- Model Context Protocol (MCP)
- Agent-2-Agent (A2A)


## Initial thoughts about system design

### Chat with Assistant
1. The user starts the conversation.
2. The bot / agent asks the user for some clarifications (if needed)
3. If the bot is able to identify the task at hand, whether it'd be adding or updating a reminder, or a task, or adding and organizing a new brain dump (with timestamp).
4. The agent has access to "tools" via MCPs.
5. The different AI agents (Task Agent, Notes Agent, Brain-Dump / Projects Agent) can talk to each other via A2A, and each of them have access to the corresponding MCPs.
6. Each agent is also able to reason about the task at hand.
7. The agent is able to "remember" previous conversations via a short-term and long-term memory. These can be accessed through Mem0 or a relational database approach, although Mem0 could be preferred.
8. The agent shows the "Thinking" process 

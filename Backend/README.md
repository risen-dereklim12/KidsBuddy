# KidsBuddy Backend

KidsBuddy Backend is a lightweight, asynchronous API service built with **FastAPI** to power the KidsBuddy Mascot Chatbot. It manages child-safe guardrails and routes messages to various LLM (Large Language Model) providers like Gemini, OpenAI, Claude, Deepseek, or Ollama.

## Key Features

1. **Safety Guardrails (`app/guardrails.py`)**:
   - Analyzes incoming messages for inappropriate, abusive, or sensitive content.
   - Intercepts unsafe queries before they reach the LLM, responding with supportive redirect suggestions (e.g., telling jokes or animal facts).
2. **Multi-Provider LLM Service (`app/services/llm.py`)**:
   - Supports plug-and-play LLM routing.
   - Integrated providers:
     - **Gemini** (using `google-genai` SDK)
     - **OpenAI** (using `openai` SDK)
     - **Claude** (using `anthropic` SDK)
     - **Deepseek** (using OpenAI compatible client)
     - **Ollama** (for local models like Llama 3)
     - **Mock Provider** (for offline testing)
3. **Structured Mascot Responses**:
   - Formats responses to include mascot expressions (e.g., `happy`, `thinking`, `curious`, `excited`) so the frontend can animate the virtual mascot dynamically.

---

## Setup & Running Guide

### Prerequisites

- Python 3.10 or newer (tested with Python 3.13)
- Active internet connection (unless using Ollama or Mock provider)

### 1. Set Up Virtual Environment

In the `Backend` directory, create and activate a virtual environment:

```bash
# Create the virtual environment
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate
```

### 2. Install Dependencies

Install the required python packages:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your settings:
   - **`LLM_PROVIDER`**: Choose your provider (`gemini`, `openai`, `claude`, `deepseek`, `ollama`, or `mock`).
   - Add the respective API key for your chosen provider.
   - **Model Selection Configuration** (Optional):
     - `GEMINI_MODEL`: Choose a Gemini model (defaults to `gemini-2.5-flash`).
     - `OPENAI_MODEL`: Choose an OpenAI model (defaults to `gpt-4o-mini`).
     - `CLAUDE_MODEL`: Choose a Claude model (defaults to `claude-3-5-sonnet-latest`).
     - `DEEPSEEK_MODEL`: Choose a Deepseek model (defaults to `deepseek-chat`).

### 4. Start the Backend Server

With the virtual environment activated, launch the development server using Uvicorn:

```bash
python -m uvicorn app.main:app --reload
```

The backend server will run on `http://localhost:8000`.

- API Interactive Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative Docs (ReDoc): [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## API Documentation

### 1. Health Check
* **Endpoint**: `GET /health`
* **Description**: Verifies if the backend server is running and shows the active LLM provider.
* **Response**:
  ```json
  {
    "status": "healthy",
    "provider": "gemini",
    "ollama_model": null
  }
  ```

### 2. Chat API
* **Endpoint**: `POST /api/chat`
* **Description**: Sends a message to the AI Mascot chatbot with chat history.
* **Request Body**:
  ```json
  {
    "message": "Tell me a cool animal fact!",
    "history": [
      {
        "sender": "user",
        "text": "Hello Buddy!"
      },
      {
        "sender": "bot",
        "text": "Hello there! I'm Buddy. What would you like to talk about today?"
      }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "text": "Did you know that octopuses have three hearts? 🐙",
    "expression": "excited",
    "suggestions": [
      "Tell me a story 📖",
      "Play a game 🎮",
      "Another fact! 💡"
    ]
  }
  ```

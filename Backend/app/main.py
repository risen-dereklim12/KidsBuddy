from datetime import datetime
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

from app.config import settings
from app.guardrails import check_input_safety
from app.services.llm import get_llm_response

def log_chat_interaction(sender: str, text: str):
    """Logs chat interactions to standard console out and a dated log file in the logs folder."""
    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"{timestamp} | {sender} | {text}"
    print(log_line)
    try:
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        logs_dir = os.path.join(backend_dir, "logs")
        os.makedirs(logs_dir, exist_ok=True)
        
        date_str = now.strftime("%Y%m%d")
        log_filename = f"chat_interactions_{date_str}.log"
        log_file_path = os.path.join(logs_dir, log_filename)
        
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(log_line + "\n")
    except Exception:
        pass

app = FastAPI(
    title="KidsBuddy API",
    description="Backend API for KidsBuddy AI Mascot Chatbot",
    version="1.0.0"
)

# Configure CORS Middleware
# Allows localhost development and configurable deployment URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessageInput(BaseModel):
    id: Optional[str] = None
    sender: str  # "user" or "bot"
    text: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessageInput]

class ChatResponse(BaseModel):
    text: str
    expression: str
    suggestions: Optional[List[str]] = None

@app.get("/health")
def health_check():
    """Simple endpoint to verify server is running and check LLM configuration."""
    return {
        "status": "healthy",
        "provider": settings.LLM_PROVIDER,
        "ollama_model": settings.OLLAMA_MODEL if settings.LLM_PROVIDER == "ollama" else None
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Ingests message and history, filters it through guardrails,
    requests LLM response, and returns response with mascot expression.
    """
    # Log incoming user speech
    log_chat_interaction("User", request.message)

    # 1. Apply Local Safety Guardrail Check
    is_safe, warning_text = check_input_safety(request.message)
    if not is_safe:
        log_chat_interaction("Bot", warning_text)
        return ChatResponse(
            text=warning_text,
            expression="idle",
            # Child-safe options to redirect the child's focus
            suggestions=["Tell me a joke! 🤪", "Animal facts 🧐", "Tell me a story 📖"]
        )

    # 2. Convert history to standardized list for the LLM service
    llm_history = []
    for msg in request.history:
        # Ignore custom warnings/fallback messages to avoid confusing the LLM context
        if "dino ears heard a word" in msg.text or "Buddy loves kindness" in msg.text:
            continue
        llm_history.append({
            "sender": msg.sender,
            "text": msg.text
        })
    
    # Append the current message
    llm_history.append({
        "sender": "user",
        "text": request.message
    })

    # 3. Call the LLM provider
    try:
        text, expression = await get_llm_response(llm_history)
        
        # 4. Generate context-aware suggestions dynamically based on content keywords
        suggestions = ["Tell me a joke! 🤪", "Tell me a story 📖", "Let's play a game 🎮"]
        lower_text = text.lower()
        if "joke" in lower_text:
            suggestions = ["Another joke! 😂", "Tell me a fact 🧐", "Let's play a game 🎮"]
        elif "story" in lower_text or "dragon" in lower_text:
            suggestions = ["Another story! 🐉", "Tell me a joke! 🤪", "Play a game 🎮"]
        elif "fact" in lower_text or "science" in lower_text:
            suggestions = ["Tell me a story 📖", "Play a game 🎮", "Another fact! 💡"]
        elif "game" in lower_text or "play" in lower_text or "trivia" in lower_text:
            suggestions = ["Elephant! 🐘", "8 legs! 🕷️", "Scissors ✌️"]
            
        log_chat_interaction("Bot", text)
        return ChatResponse(
            text=text,
            expression=expression,
            suggestions=suggestions
        )
    except Exception as e:
        log_chat_interaction("Error", f"Failed to generate response: {str(e)}")
        # Graceful error response
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the chatbot response: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

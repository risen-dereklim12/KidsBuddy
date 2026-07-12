import json
import logging
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.guardrails import SYSTEM_PROMPT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JSON response instructions to append to the system prompt
JSON_INSTRUCTIONS = """
Your output MUST be a single valid JSON object. Do not include any markdown formatting like ```json or ```. 
The JSON object must have exactly these keys:
- "text": (string) Your friendly, encouraging message to the child.
- "expression": (string) The facial expression Buddy should make. Select exactly one of these choices: "happy", "speaking", "thinking", "idle".

Example response:
{"text": "Wow, that is amazing! Octopuses really have blue blood! 🐙💙 Let's learn more!", "expression": "happy"}
"""

FULL_SYSTEM_PROMPT = SYSTEM_PROMPT + "\n" + JSON_INSTRUCTIONS

def parse_llm_response(raw_response: str) -> Tuple[str, str]:
    """
    Parses the LLM output. Attempts to read it as JSON.
    If it fails, returns the raw text and defaults the expression to 'speaking'.
    """
    clean_text = raw_response.strip()
    # Strip markdown block formatting if the model ignored instructions
    if clean_text.startswith("```json"):
        clean_text = clean_text[7:]
    if clean_text.startswith("```"):
        clean_text = clean_text[3:]
    if clean_text.endswith("```"):
        clean_text = clean_text[:-3]
    clean_text = clean_text.strip()

    try:
        data = json.loads(clean_text)
        text = data.get("text", "")
        expression = data.get("expression", "speaking")
        if expression not in {"happy", "speaking", "thinking", "idle"}:
            expression = "speaking"
        return text, expression
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON from response: {raw_response}")
        # Return raw text if JSON parse failed
        return raw_response, "speaking"

async def call_gemini(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Calls the Google Gemini API using google-genai client."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in environment.")

    # Import google-genai dynamically to avoid import errors if not installed
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Map chat history format to Gemini format
    contents = []
    for msg in messages:
        role = "user" if msg["sender"] == "user" else "model"
        content_text = f"<user_input>{msg['text']}</user_input>" if msg["sender"] == "user" else msg["text"]
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=content_text)]
        ))

    # Add the current instruction
    config = types.GenerateContentConfig(
        system_instruction=FULL_SYSTEM_PROMPT,
        temperature=0.7,
        max_output_tokens=300,
        response_mime_type="application/json"
    )

    # Use configured model
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=contents,
        config=config
    )
    return parse_llm_response(response.text)

async def call_openai(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Calls the OpenAI Chat API."""
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set in environment.")

    import openai
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    # Build messages list
    api_messages = [{"role": "system", "content": FULL_SYSTEM_PROMPT}]
    for msg in messages:
        role = "user" if msg["sender"] == "user" else "assistant"
        content_text = f"<user_input>{msg['text']}</user_input>" if msg["sender"] == "user" else msg["text"]
        api_messages.append({"role": role, "content": content_text})

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=300,
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content or ""
    return parse_llm_response(content)

async def call_claude(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Calls the Anthropic Claude API."""
    if not settings.ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not set in environment.")

    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Build messages list
    api_messages = []
    for msg in messages:
        role = "user" if msg["sender"] == "user" else "assistant"
        content_text = f"<user_input>{msg['text']}</user_input>" if msg["sender"] == "user" else msg["text"]
        api_messages.append({"role": role, "content": content_text})

    response = await client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=300,
        system=FULL_SYSTEM_PROMPT,
        messages=api_messages,
        temperature=0.7
    )
    content = response.content[0].text if response.content else ""
    return parse_llm_response(content)

async def call_deepseek(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Calls the Deepseek API using OpenAI compatible endpoint."""
    if not settings.DEEPSEEK_API_KEY:
        raise ValueError("DEEPSEEK_API_KEY is not set in environment.")

    import openai
    client = openai.AsyncOpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url=settings.DEEPSEEK_API_BASE)

    # Build messages list
    api_messages = [{"role": "system", "content": FULL_SYSTEM_PROMPT}]
    for msg in messages:
        role = "user" if msg["sender"] == "user" else "assistant"
        content_text = f"<user_input>{msg['text']}</user_input>" if msg["sender"] == "user" else msg["text"]
        api_messages.append({"role": role, "content": content_text})

    response = await client.chat.completions.create(
        model=settings.DEEPSEEK_MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=300,
        response_format={"type": "json_object"}
    )
    content = response.choices[0].message.content or ""
    return parse_llm_response(content)

async def call_ollama(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Calls the local Ollama instance (using OpenAI compatible server)."""
    import openai
    # Ollama v1 api is OpenAI compatible
    client = openai.AsyncOpenAI(api_key="ollama", base_url=settings.OLLAMA_API_BASE)

    # Build messages list
    api_messages = [{"role": "system", "content": FULL_SYSTEM_PROMPT}]
    for msg in messages:
        role = "user" if msg["sender"] == "user" else "assistant"
        content_text = f"<user_input>{msg['text']}</user_input>" if msg["sender"] == "user" else msg["text"]
        api_messages.append({"role": role, "content": content_text})

    try:
        response = await client.chat.completions.create(
            model=settings.OLLAMA_MODEL,
            messages=api_messages,
            temperature=0.7,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or ""
        return parse_llm_response(content)
    except Exception as e:
        logger.error(f"Ollama call failed: {e}. Ensure Ollama is running and model '{settings.OLLAMA_MODEL}' is pulled.")
        raise e

def generate_mock_response(user_input: str) -> Tuple[str, str]:
    """Simulates responses if LLM provider is set to 'mock'."""
    lower_input = user_input.lower()
    if "joke" in lower_input:
        return "What do you call a dinosaur that is a noisy sleeper? A Tyranno-snore-us! 🦖💤", "happy"
    if "story" in lower_input:
        return "Once upon a time, a tiny dragon named Pippin breathed colorful bubbles instead of fire! 🐉🫧 He threw the best parties!", "happy"
    if "fact" in lower_input:
        return "Did you know that honey never spoils? You could eat honey that is 3,000 years old! 🍯🐝", "happy"
    return "Hi there, friend! I'm Buddy. Let's talk about space, science, or play a game! 🦕✨", "speaking"

async def get_llm_response(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """
    Unified entry point to get LLM response.
    Routes to the configured provider.
    """
    provider = settings.LLM_PROVIDER
    logger.info(f"Generating chat response using provider: {provider}")

    if not messages:
        return "Hello! How can I help you today? 🦕", "happy"

    user_message = messages[-1]["text"]

    if provider == "mock":
        return generate_mock_response(user_message)

    try:
        if provider == "gemini":
            return await call_gemini(messages)
        elif provider == "openai":
            return await call_openai(messages)
        elif provider == "claude":
            return await call_claude(messages)
        elif provider == "deepseek":
            return await call_deepseek(messages)
        elif provider == "ollama":
            return await call_ollama(messages)
    except Exception as e:
        logger.error(f"Error calling provider {provider}: {e}. Falling back to mock generator.")
        return generate_mock_response(user_message)

    return generate_mock_response(user_message)

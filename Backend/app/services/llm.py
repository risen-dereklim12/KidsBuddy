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

def is_quota_or_billing_error(e: Exception) -> bool:
    """
    Checks if the exception indicates a quota/token run-out or billing error
    across various API providers (OpenAI, Anthropic, Gemini, Deepseek).
    """
    err_str = str(e).lower()
    
    # Check for specific status codes (e.g., 429 Too Many Requests/Quota, 402 Payment Required)
    status_code = None
    if hasattr(e, "status_code"):
        status_code = getattr(e, "status_code")
    elif hasattr(e, "code"):
        val = getattr(e, "code")
        if isinstance(val, int):
            status_code = val
            
    if status_code in (402, 429):
        return True
        
    # Check key phrases in the error message
    quota_phrases = [
        "quota", 
        "billing", 
        "insufficient funds", 
        "insufficient_funds", 
        "credit", 
        "payment required", 
        "too many requests", 
        "rate limit", 
        "limit exceeded",
        "resource exhausted", 
        "resource_exhausted",
        "exhausted", 
        "tokens exceeded",
        "insufficient_quota"
    ]
    
    return any(phrase in err_str for phrase in quota_phrases)

hf_model = None
hf_tokenizer = None
hf_downloading = False

def is_hf_model_cached() -> bool:
    """Checks if the Hugging Face model config is already cached locally."""
    model_id = settings.HUGGINGFACE_LOCAL_MODEL
    if not model_id:
        return False
    
    try:
        from huggingface_hub import try_to_load_from_cache
        filepath = try_to_load_from_cache(repo_id=model_id, filename="config.json")
        return filepath is not None
    except Exception as e:
        logger.warning(f"Error checking Hugging Face cache: {e}")
        return False

def bg_download_model():
    """Background target function to download the model files."""
    global hf_downloading
    try:
        get_hf_local_model_and_tokenizer()
    except Exception as e:
        logger.error(f"Background Hugging Face download failed: {e}")
    finally:
        hf_downloading = False

def start_background_download():
    """Starts the Hugging Face model download in a background thread."""
    global hf_downloading
    hf_downloading = True
    import threading
    thread = threading.Thread(target=bg_download_model)
    thread.daemon = True
    thread.start()

def get_hf_local_model_and_tokenizer():
    """
    Lazy loads the Hugging Face model and tokenizer locally.
    Caches them in global variables to reuse across requests.
    """
    global hf_model, hf_tokenizer
    if hf_model is None or hf_tokenizer is None:
        model_id = settings.HUGGINGFACE_LOCAL_MODEL
        if not model_id:
            raise ValueError("HUGGINGFACE_LOCAL_MODEL is not set in environment.")
        
        logger.info(f"Loading Hugging Face model '{model_id}' locally. This may take a while on the first run as files download...")
        
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            import torch
        except ImportError:
            raise ImportError(
                "Missing local Hugging Face dependencies. "
                "Please run: pip install transformers torch accelerate"
            )
        
        api_key = settings.HUGGINGFACE_API_KEY or None
        
        hf_tokenizer = AutoTokenizer.from_pretrained(model_id, token=api_key)
        
        # Detect acceleration device map
        if torch.cuda.is_available():
            device_map = "auto"
            torch_dtype = torch.float16
            device = None
        elif torch.backends.mps.is_available():
            # Avoid using device_map="auto" on MPS due to PyTorch 'meta' device compatibility issues
            device_map = None
            torch_dtype = torch.float16
            device = "mps"
        else:
            device_map = None
            torch_dtype = torch.float32
            device = "cpu"
            
        hf_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            token=api_key,
            torch_dtype=torch_dtype,
            device_map=device_map
        )
        
        if device is not None:
            hf_model = hf_model.to(device)
            
    return hf_model, hf_tokenizer

async def call_huggingface(messages: List[Dict[str, str]]) -> Tuple[str, str]:
    """Runs inference locally using the downloaded Hugging Face model."""
    model, tokenizer = get_hf_local_model_and_tokenizer()
    
    # Build prompt with system prompt context and chat history
    prompt = f"<system>\n{FULL_SYSTEM_PROMPT}\n</system>\n"
    for msg in messages:
        if msg["sender"] == "user":
            prompt += f"<user>\n<user_input>{msg['text']}</user_input>\n</user> "
        else:
            prompt += f"<assistant>\n{msg['text']}\n</assistant> "
    prompt += "<assistant>\n"

    import torch
    inputs = tokenizer(prompt, return_tensors="pt")
    
    # Move inputs to same device as model
    device = model.device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=300,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
        
    input_length = inputs["input_ids"].shape[1]
    generated_tokens = outputs[0][input_length:]
    raw_response = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    return parse_llm_response(raw_response)

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

    # Intercept first-time downloads for local Hugging Face models
    if provider == "huggingface":
        global hf_model, hf_downloading
        if hf_model is None:
            if not is_hf_model_cached():
                if hf_downloading:
                    return (
                        "I am still downloading my local model from Hugging Face! Please wait a few more moments for the setup to finish. 🦖📥",
                        "thinking"
                    )
                else:
                    logger.info("Local Hugging Face model not cached. Starting background download...")
                    start_background_download()
                    return (
                        f"I am downloading my local model ({settings.HUGGINGFACE_LOCAL_MODEL}) from Hugging Face for the first time! "
                        "Please wait a few moments for the setup to finish. 🦖📥",
                        "thinking"
                    )
            elif hf_downloading:
                return (
                    "I am still setting up my local model! Please wait a few more moments. 🦖📥",
                    "thinking"
                )

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
        elif provider == "huggingface":
            return await call_huggingface(messages)
    except Exception as e:
        logger.error(f"Error calling provider {provider}: {e}")
        err_msg = str(e)
        if "Missing local Hugging Face dependencies" in err_msg or "ImportError" in type(e).__name__:
            return (
                "Oh oh! 🦕 My local Hugging Face brain is missing some parts. Please ask your parents to install them by running: pip install transformers torch accelerate 🛠️",
                "idle"
            )
        if "sentencepiece" in err_msg.lower() or "tiktoken" in err_msg.lower() or "tokenizer" in err_msg.lower():
            return (
                "Oh oh! 🦕 My local Hugging Face brain is missing the sentencepiece tokenizer. Please ask your parents to install it by running: pip install sentencepiece 🛠️",
                "idle"
            )
        if "gated" in err_msg.lower() or "unauthorized" in err_msg.lower() or "401" in err_msg.lower() or "403" in err_msg.lower():
            return (
                "Oh oh! 🦕 I couldn't download my brain from Hugging Face because it needs permission. Please ask your parents to set a valid HUGGINGFACE_API_KEY with access to this model! 🔑",
                "idle"
            )
        if is_quota_or_billing_error(e):
            return (
                "Oh oh! 🦕 My dino energy tokens have run out! Could you please ask your parents to check my API keys or top up the tokens so I can keep chatting and playing with you? 🦖✨",
                "idle"
            )
        logger.info("Falling back to mock generator.")
        return generate_mock_response(user_message)

    return generate_mock_response(user_message)

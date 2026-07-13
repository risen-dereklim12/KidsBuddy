import os
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Load environment variables from .env in the parent (Backend) directory if present
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    # LLM Provider Configuration
    # Supported values: "gemini", "openai", "claude", "deepseek", "ollama", "mock"
    LLM_PROVIDER: str = "gemini"

    # API Keys & Endpoints
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None

    # Model Selection settings
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    OPENAI_MODEL: str = "gpt-5.4-nano"
    CLAUDE_MODEL: str = "claude-haiku-4-5"
    DEEPSEEK_MODEL: str = "deepseek-v4-flash"

    # Deepseek endpoint overrides (defaults to standard API)
    DEEPSEEK_API_BASE: str = "https://api.deepseek.com"

    # Ollama settings (for local LLMs)
    OLLAMA_API_BASE: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "llama3"

    # Hugging Face Local LLM Override
    HUGGINGFACE_LOCAL_MODEL: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None

    @model_validator(mode="after")
    def apply_local_override(self) -> 'Settings':
        if not self.HUGGINGFACE_API_KEY:
            self.HUGGINGFACE_API_KEY = os.getenv("HF_API_KEY")
            
        if self.HUGGINGFACE_LOCAL_MODEL and self.HUGGINGFACE_LOCAL_MODEL.strip():
            self.LLM_PROVIDER = "huggingface"
        return self

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("LLM_PROVIDER")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        provider = v.strip().lower()
        allowed = {"gemini", "openai", "claude", "deepseek", "ollama", "huggingface", "mock"}
        if provider not in allowed:
            raise ValueError(f"LLM_PROVIDER must be one of {allowed}")
        return provider

settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    port: int = 8000
    # Provide a safe default for tests/local without envs (file-based sqlite)
    database_url: str = "postgresql+psycopg://note_user:note_pass@db:5432/note_db"
    ollama_host: str = "http://ollama:11434"
    ollama_model: str = "qwen2.5:7b"


settings = Settings()

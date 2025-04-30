from pydantic import BaseSettings

class Settings(BaseSettings):
    openrouter_api_key: str
    app_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()
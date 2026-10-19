"""
SynRide Configuration Settings
Uses Pydantic Settings to load and validate environment variables.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    APP_NAME: str = "SynRide"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = Field(default="change-this-to-a-secure-random-secret-key-at-least-32-chars-long")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Oracle Database Settings
    DB_USER: str = "SYSTEM[SYNRIDE]"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 1521
    DB_SERVICE: str = "FREEPDB1"
    DB_POOL_MIN: int = 2
    DB_POOL_MAX: int = 10
    
    # Security & Verification Rules
    OTP_EXPIRE_MINUTES: int = 10
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    MAX_OTP_ATTEMPTS: int = 5
    OTP_LOCKOUT_MINUTES: int = 15
    MAX_EMAIL_CHANGES_24H: int = 3
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

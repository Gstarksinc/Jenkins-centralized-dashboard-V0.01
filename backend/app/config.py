from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    ENVIRONMENT: str = Field(default="development")
    APP_NAME: str = Field(default="Jenkins Control Center")
    LOG_LEVEL: str = Field(default="INFO")
    SECRET_KEY: str = Field(default="dev-insecure-secret-key-32-chars-long!")
    SECRET_KEY_ENCRYPTION: str = Field(default="8Z1xVj1xV8zQY7P4wN1vK6tR3bM9eL2sA5hG0yD4fUo=")

    # Network / Host
    BACKEND_HOST: str = Field(default="0.0.0.0")
    BACKEND_PORT: int = Field(default=8000)
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    ALLOWED_CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000", "http://127.0.0.1:3000"])

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://jenkins_admin:jenkins_secure_password_replace_me@localhost:5432/jenkins_cc"
    )
    POSTGRES_DB: str = Field(default="jenkins_cc")
    POSTGRES_USER: str = Field(default="jenkins_admin")
    POSTGRES_PASSWORD: str = Field(default="jenkins_secure_password_replace_me")

    # Redis & Celery
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")

    # Session & Security
    SESSION_COOKIE_NAME: str = Field(default="jcc_session")
    SESSION_EXPIRE_HOURS: int = Field(default=12)
    SESSION_COOKIE_SECURE: bool = Field(default=False)
    SESSION_COOKIE_SAMESITE: str = Field(default="lax")
    CSRF_COOKIE_NAME: str = Field(default="jcc_csrf")
    RATE_LIMIT_LOGIN_ATTEMPTS: int = Field(default=5)
    RATE_LIMIT_WINDOW_SECONDS: int = Field(default=900)

    # SSRF Protection
    ALLOW_PRIVATE_IPS_FOR_JENKINS: bool = Field(default=False)


settings = Settings()

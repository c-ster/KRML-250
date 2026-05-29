from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    debug: bool = False
    secret_key: str = "changeme-secret-key"
    admin_token: str = "changeme-admin-token"
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str = "postgresql://user:password@localhost:5432/krml250"

    email_provider: str = "none"  # none | smtp | sendgrid
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    sendgrid_api_key: str = ""
    from_email: str = "noreply@krml.com"
    frontend_url: str = "http://localhost:3000"

    log_level: str = "info"

    @property
    def sync_database_url(self) -> str:
        url = self.database_url
        # Ensure we use psycopg2 sync driver
        if url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
        return url


settings = Settings()

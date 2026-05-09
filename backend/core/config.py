from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TableBoost API"
    DATABASE_URL: str = "postgresql://user:password@localhost/tableboost"

    class Config:
        env_file = ".env"

settings = Settings()

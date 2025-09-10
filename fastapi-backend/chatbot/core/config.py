from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache


class Settings(BaseSettings):
    # API Configuration
    api_title: str = "RAG-Enhanced Chatbot"
    api_version: str = "1.0.0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # OpenAI API Key
    openai_api_key: Optional[str] = None

    # Vector Store Configuration (Chroma legacy kept for completeness)
    chroma_persist_directory: str = "./chroma_db"
    chroma_collection_name: str = "knowledge_base"

    # Pinecone Configuration
    pinecone_api_key: str | None = None # also respected via env PINECONE_API_KEY
    pinecone_environment: Optional[str] = None  # legacy (pods); not used for serverless
    pinecone_index_name: str = "knowledge-base"
    pinecone_cloud: Optional[str] = "aws"       # serverless
    pinecone_region: Optional[str] = "us-east-1"

    # Retrieval Configuration
    retrieval_k: int = 5
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # LLM Configuration
    llm_model: str = "gpt-3.5-turbo"
    embedding_model: str = "text-embedding-3-small"
    llm_temperature: float = 0.7

    # Performance Configuration
    max_workers: int = 3
    max_file_size: int = 50 * 1024 * 1024  # 50MB

    # Caching Configuration
    enable_caching: bool = True
    cache_ttl: int = 3600  # 1 hour

    # CORS Configuration
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]

    # File Upload Configuration
    allowed_extensions: List[str] = ['.pdf', '.txt', '.csv', '.doc', '.docx', '.ppt', '.pptx']
    temp_dir: str = "/tmp"

    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    class Config:
        extra = "allow"
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def api_keys(self) -> List[str]:
        """Get all available API keys"""
        keys = []
        if self.openai_api_key:
            keys.append(self.openai_api_key)
        return keys

    def validate_api_keys(self):
        """Validate that at least one API key is available"""
        if not self.api_keys:
            raise ValueError("No valid OpenAI API key found in environment variables")


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()

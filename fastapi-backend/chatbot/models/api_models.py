from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Optional, Any
from enum import Enum


class FileType(str, Enum):
    PDF = "pdf"
    TXT = "txt"
    CSV = "csv"
    DOC = "doc"
    DOCX = "docx"
    PPT = "ppt"
    PPTX = "pptx"


class SearchType(str, Enum):
    SIMILARITY = "similarity"
    MMR = "mmr"
    SIMILARITY_SCORE_THRESHOLD = "similarity_score_threshold"


# Chat Models
class Message(BaseModel):
    user_id: str = Field(..., min_length=1, description="Unique user identifier")
    message: str = Field(..., min_length=1, description="User message content")
    new_chat: bool = Field(default=False, description="Start a new chat session")
    use_rag: bool = Field(default=True, description="Enable RAG for this query")
    group_id: Optional[str] = Field(default=None, description="Group identifier for per-group context")

    @field_validator("user_id")
    def user_id_must_not_be_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError("user_id cannot be empty or whitespace")
        return str(v).strip()

    @field_validator("message")
    def message_must_not_be_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError("message cannot be empty or whitespace")
        return str(v).strip()


class ChatResponse(BaseModel):
    user_id: str
    input: str
    response: str
    message_count: int
    sources_used: Optional[List[str]] = None
    rag_enabled: bool = False
    response_time_ms: Optional[float] = None
    model_used: Optional[str] = None


class ChatHistory(BaseModel):
    user_id: str
    message_count: int
    messages: List[Dict[str, Any]]


# Document Models
class DocumentInfo(BaseModel):
    filename: str
    file_type: FileType
    chunk_count: int
    status: str
    file_size: Optional[int] = None
    upload_timestamp: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    document_info: DocumentInfo
    processing_time_ms: float
    chunks_created: int


# Knowledge Base Models
class KnowledgeBaseInfo(BaseModel):
    total_documents: int
    total_chunks: int
    status: str
    last_updated: Optional[str] = None
    storage_size_mb: Optional[float] = None


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of results to return")
    search_type: SearchType = Field(default=SearchType.SIMILARITY, description="Type of search")
    score_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Minimum similarity score")

    @field_validator("query")
    def query_must_not_be_empty(cls, v):
        if not v or not str(v).strip():
            raise ValueError("query cannot be empty or whitespace")
        return str(v).strip()


class SearchResult(BaseModel):
    content: str
    metadata: Dict[str, Any]
    score: float
    chunk_id: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    search_time_ms: Optional[float] = None


# Health Check Models
class HealthResponse(BaseModel):
    status: str
    api_keys_available: int
    knowledge_base_status: str
    documents_loaded: int
    memory_usage_mb: Optional[float] = None
    uptime_seconds: Optional[float] = None


# Error Models
class ErrorResponse(BaseModel):
    error: str
    detail: str
    timestamp: str
    request_id: Optional[str] = None


# Configuration Models
class RAGConfig(BaseModel):
    chunk_size: int = Field(default=1000, ge=100, le=4000)
    chunk_overlap: int = Field(default=200, ge=0, le=500)
    retrieval_k: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)

    @field_validator("chunk_overlap")
    def overlap_must_be_less_than_chunk_size(cls, v, info=None):
        # info might be None depending on pydantic version; guard for it
        data = getattr(info, "data", {}) if info else {}
        if "chunk_size" in data and v >= data["chunk_size"]:
            raise ValueError("chunk_overlap must be less than chunk_size")
        return v


# Batch Processing Models
class BatchUploadRequest(BaseModel):
    files: List[str]  # File paths or identifiers
    config: Optional[RAGConfig] = None


class BatchUploadResponse(BaseModel):
    total_files: int
    successful_uploads: int
    failed_uploads: int
    results: List[DocumentUploadResponse]
    total_processing_time_ms: float


# Stats Models
class UsageStats(BaseModel):
    total_queries: int
    rag_queries: int
    regular_queries: int
    average_response_time_ms: float
    documents_processed: int
    active_users: int
    cache_hit_rate: Optional[float] = None


# WebSocket Models (for future streaming support)
class WSMessage(BaseModel):
    type: str  # 'message', 'typing', 'error', etc.
    data: Dict[str, Any]
    timestamp: str


class WSResponse(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: str

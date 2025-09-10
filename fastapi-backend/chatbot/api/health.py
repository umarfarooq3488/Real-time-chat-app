from fastapi import APIRouter
import time
import psutil
from chatbot.models.api_models import HealthResponse
from chatbot.services.llm_service import get_llm_service
from chatbot.services.vector_service import get_vector_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint"""
    
    try:
        # Get services
        llm_service = await get_llm_service()
        vector_service = await get_vector_service()
        
        # Get service health
        llm_health = await llm_service.health_check()
        vector_health = await vector_service.health_check()
        
        # Get system info
        memory_info = psutil.virtual_memory()
        
        return HealthResponse(
            status="healthy" if llm_health.get("status") == "healthy" and vector_health.get("status") in ["healthy", "healthy_empty"] else "unhealthy",
            api_keys_available=len(llm_service.llm_pool._llm_pool) if hasattr(llm_service.llm_pool, '_llm_pool') else 0,
            knowledge_base_status="active" if vector_service.document_count > 0 else "empty",
            documents_loaded=vector_service.document_count,
            memory_usage_mb=memory_info.used / 1024 / 1024,
            uptime_seconds=time.time()  # You can track actual uptime
        )
        
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            api_keys_available=0,
            knowledge_base_status="error",
            documents_loaded=0,
            memory_usage_mb=0,
            uptime_seconds=0
        )
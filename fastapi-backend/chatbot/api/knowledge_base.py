from fastapi import APIRouter, HTTPException, Query
from chatbot.models.api_models import KnowledgeBaseInfo, SearchQuery, SearchResponse
from chatbot.services.vector_service import get_vector_service
import logging

router = APIRouter(
    prefix="/knowledge-base",  # Add this prefix here
    tags=["RAG"]
)

logger = logging.getLogger(__name__)


@router.get("/info", response_model=KnowledgeBaseInfo)
async def get_knowledge_base_info(group_id: str = Query(default="__default__")):
    """Get information about the knowledge base (per-group)"""
    try:
        vector_service = await get_vector_service()
        info = await vector_service.get_knowledge_base_info(group_id)  # Assuming this method exists in VectorStoreService

        return info

    except Exception as e:
        logger.exception("Error getting KB info")
        raise HTTPException(status_code=500, detail=f"KB info error: {e}")


@router.delete("/clear")
async def clear_knowledge_base(group_id: str = Query(default="__default__")):
    """Clear the entire knowledge base (per-group)"""
    try:
        vector_service = await get_vector_service()
        await vector_service.clear_knowledge_base(group_id)  # Assuming this method exists

    except HTTPException as http_ex:
        raise http_ex  # Re-raise HTTPExceptions

    except Exception as e:
        logger.exception("Error clearing KB")
        raise HTTPException(status_code=500, detail=f"Error clearing KB: {e}")


@router.post("/search", response_model=SearchResponse)
async def search_knowledge_base(search_query: SearchQuery, group_id: str = Query(default="__default__")):
    """Search the knowledge base directly (per-group)"""
    try:
        vector_service = await get_vector_service()
        results = await vector_service.search_knowledge_base(search_query, group_id) # Assuming this method exists
        return results

    except Exception as e:
        logger.exception("Error searching KB")
        raise HTTPException(status_code=500, detail=f"Error searching KB: {e}")
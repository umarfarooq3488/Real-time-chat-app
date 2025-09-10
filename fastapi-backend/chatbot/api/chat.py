from fastapi import APIRouter, HTTPException, Depends, Request
import asyncio
import time
import logging
from typing import Dict, Any, Optional

from chatbot.models.api_models import Message, ChatResponse
from chatbot.services.llm_service import get_llm_service
from chatbot.services.vector_service import get_vector_service
from chatbot.services.chat_service import ChatService
from chatbot.utils.performance_optimizations import ResponseCache

logger = logging.getLogger(__name__)
router = APIRouter()

# Global chat service instance
_chat_service: Optional[ChatService] = None

async def get_chat_service() -> ChatService:
    """Get or create the global chat service instance"""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service

async def get_response_cache(request: Request) -> ResponseCache:
    """Dependency to get response cache from app state"""
    return request.app.state.response_cache


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    message: Message,
    request: Request,
    cache: ResponseCache = Depends(get_response_cache)
):
    """Enhanced chat endpoint with RAG capability and caching"""
    
    start_time = time.time()
    
    try:
        # Validate input
        if not message.user_id.strip():
            raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
        if not message.message.strip():
            raise HTTPException(status_code=400, detail="message cannot be empty")

        # Get chat service
        chat_service = await get_chat_service()

        # Check cache first
        cache_key = f"{message.user_id}:{hash(message.message)}:{message.use_rag}:{message.group_id or ''}"
        cached_response = await cache.get(cache_key)
        
        if cached_response:
            logger.info(f"Cache hit for user {message.user_id}")
            cached_response['response_time_ms'] = (time.time() - start_time) * 1000
            cached_response['from_cache'] = True
            return ChatResponse(**cached_response)

        # Process chat message
        response_data = await chat_service.process_message(message)
        
        # Cache successful responses (only if no errors)
        if not response_data.get('error'):
            await cache.set(cache_key, response_data)
        
        # Add timing
        response_data['response_time_ms'] = (time.time() - start_time) * 1000
        response_data['from_cache'] = False
        
        return ChatResponse(**response_data)

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/chat/history/{user_id}")
async def get_chat_history(user_id: str):
    """Get chat history for a specific user"""
    try:
        if not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
        chat_service = await get_chat_service()
        history_data = await chat_service.get_user_history(user_id)
        return history_data
    
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")


@router.delete("/chat/history/{user_id}")
async def clear_chat_history(user_id: str):
    """Clear chat history for a specific user"""
    try:
        if not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
        chat_service = await get_chat_service()
        result = await chat_service.clear_user_history(user_id)
        return result
    
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")


@router.get("/chat/health")
async def chat_health_check():
    """Health check endpoint for chat service"""
    try:
        chat_service = await get_chat_service()
        health_data = await chat_service.health_check()
        return health_data
    
    except Exception as e:
        logger.error(f"Error in chat health check: {str(e)}", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e)
        }
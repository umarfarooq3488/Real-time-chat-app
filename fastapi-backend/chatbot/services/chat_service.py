import logging
from typing import Dict, Any, List, Optional

from langchain_community.chat_message_histories import ChatMessageHistory

from chatbot.models.api_models import Message
from chatbot.services.llm_service import get_llm_service
from chatbot.services.vector_service import get_vector_service

logger = logging.getLogger(__name__)


class ChatService:
    """
    High-level chat service that handles RAG or regular LLM responses, with session history.
    This is the corrected, definitive version.
    """

    def __init__(self):
        self._user_histories: Dict[str, ChatMessageHistory] = {}

    async def get_session_history(self, user_id: str) -> ChatMessageHistory:
        """Gets or creates a chat history for a given user."""
        if user_id not in self._user_histories:
            self._user_histories[user_id] = ChatMessageHistory()
        return self._user_histories[user_id]

    async def process_message(self, message: Message) -> Dict[str, Any]:
        """
        Processes a user message, deciding whether to use RAG or a regular chat response.
        This method contains the corrected logic.
        """
        try:
            llm_service = await get_llm_service()
            history = await self.get_session_history(message.user_id)
            
            response_text = ""
            sources_used: List[str] = []
            rag_enabled = False

            # --- Main RAG Logic ---
            # Check if RAG is requested and a group_id is provided.
            if message.use_rag and message.group_id:
                vector_service = await get_vector_service()
                retriever = await vector_service.get_retriever(message.group_id)

                if retriever:
                    logger.info(f"RAG enabled for group '{message.group_id}'. Using modern RAG chain.")
                    rag_chain = await llm_service.create_rag_chain(retriever)
                    
                    # Invoke the full RAG chain. LangChain handles the retrieval internally.
                    result = await rag_chain.ainvoke(
                        {"input": message.message, "chat_history": history.messages}
                    )
                    
                    # The 'result' dictionary contains 'answer' and 'context'.
                    if isinstance(result, dict):
                        response_text = result.get("answer", "")
                        ctx_docs = result.get("context", [])
                        if ctx_docs:
                            sources_used = list({
                                doc.metadata.get("source_file", "Unknown")
                                for doc in ctx_docs if hasattr(doc, "metadata")
                            })
                            logger.info(f"RAG retrieved {len(ctx_docs)} docs → {sources_used}")
                        else:
                            logger.warning("RAG retrieved no context docs.")
                    else:
                        response_text = str(result)
                    rag_enabled = True
                else:
                    logger.warning(f"RAG requested for group '{message.group_id}', but no retriever was found. Falling back to regular chat.")
            
            # --- Fallback to Regular Chat ---
            # This runs if RAG was not enabled, or if the retriever failed to initialize.
            if not rag_enabled:
                logger.info("Using regular chat chain (no RAG).")
                chain = await llm_service.create_regular_chain()
                result = await chain.ainvoke({"input": message.message, "history": history.messages})
                response_text = result if isinstance(result, str) else str(result)

            # Update the conversation history
            history.add_user_message(message.message)
            history.add_ai_message(response_text)

            return {
                "user_id": message.user_id,
                "response": response_text,
                "sources_used": sources_used or None,
                "rag_enabled": rag_enabled,
            }
        except Exception as e:
            logger.error(f"Critical error in ChatService.process_message: {str(e)}", exc_info=True)
            return {"error": str(e), "response": "Sorry, I encountered a critical error while processing your request."}
import asyncio
import random
import time
import os
from typing import List, Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor
import logging

# LangChain / OpenAI wrappers you already used
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from openai import OpenAI
from langchain_core.runnables import RunnablePassthrough, RunnableParallel, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# RateLimitError can live in different places depending on SDK version.
# Import defensively and fallback to a sentinel exception type.
try:
    from openai.error import RateLimitError as OpenAI_RateLimitError
except Exception:
    try:
        # older/newer SDKs might expose directly
        from openai import RateLimitError as OpenAI_RateLimitError
    except Exception:
        OpenAI_RateLimitError = Exception  # fallback: catch general Exception for retries

from chatbot.core.config import settings
from chatbot.models.api_models import RAGConfig

logger = logging.getLogger(__name__)


class LLMConnectionPool:
    """Manages a pool of LLM connections for better performance"""

    def __init__(self, pool_size: int = 3):
        self.pool_size = pool_size
        self._llm_pool: List[ChatOpenAI] = []
        self._pool_lock = asyncio.Lock()
        self._current_index = -1
        self._initialized = False

    async def initialize(self):
        """Initialize the LLM pool"""
        if self._initialized:
            return

        async with self._pool_lock:
            if self._initialized:
                return

            api_keys = getattr(settings, 'api_keys', [os.getenv("OPENAI_API_KEY")])
            api_keys = [key for key in api_keys if key]  # Filter out None values
            
            if not api_keys:
                raise ValueError("No API keys available")

            # Create LLM instances with OpenAI
            # Create as many as pool size but rotate api keys if there are multiple keys
            for i in range(min(self.pool_size, max(1, len(api_keys) * 2))):
                api_key = api_keys[i % len(api_keys)]
                llm = ChatOpenAI(
                    model=getattr(settings, 'llm_model', 'gpt-3.5-turbo-0125'),
                    openai_api_key=api_key,
                    temperature=getattr(settings, 'llm_temperature', 0.2),
                )
                self._llm_pool.append(llm)

            self._initialized = True
            logger.info(f"LLM pool initialized with {len(self._llm_pool)} instances")

    async def get_llm(self) -> ChatOpenAI:
        """Get an LLM instance from the pool (round-robin)"""
        if not self._initialized:
            await self.initialize()

        async with self._pool_lock:
            if not self._llm_pool:
                raise ValueError("LLM pool is empty")
            self._current_index = (self._current_index + 1) % len(self._llm_pool)
            return self._llm_pool[self._current_index]

    async def get_random_llm(self) -> ChatOpenAI:
        if not self._initialized:
            await self.initialize()
        return random.choice(self._llm_pool)


class EmbeddingService:
    """Service for embeddings"""

    def __init__(self):
        self._embeddings: Optional[OpenAIEmbeddings] = None
        self._init_lock = asyncio.Lock()

    async def get_embeddings(self) -> OpenAIEmbeddings:
        # Ensure at least one API key is available
        api_keys = getattr(settings, 'api_keys', [os.getenv("OPENAI_API_KEY")])
        api_keys = [key for key in api_keys if key]
        
        if not api_keys:
            raise ValueError("No OpenAI API key configured.")

        if self._embeddings is None:
            async with self._init_lock:
                if self._embeddings is None:
                    # Use the first available API key
                    try:
                        self._embeddings = OpenAIEmbeddings(openai_api_key=api_keys[0])
                    except TypeError:
                        # Some versions accept api_key param named differently; fallback
                        self._embeddings = OpenAIEmbeddings(api_key=api_keys[0])
        return self._embeddings

    async def embed_query(self, query: str) -> List[float]:
        embeddings = await self.get_embeddings()
        # Run in executor as some embedding calls can block
        result = await asyncio.get_event_loop().run_in_executor(None, embeddings.embed_query, query)
        return result


class LLMService:
    """Service for creating and managing LangChain LLM chains."""

    def __init__(self):
        self.llm_pool = LLMConnectionPool(getattr(settings, 'max_workers', 3))
        self.embedding_service = EmbeddingService()
        self.executor = ThreadPoolExecutor(max_workers=getattr(settings, 'max_workers', 3))
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        """Initializes the ChatOpenAI model."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        return ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0.2)

    async def create_rag_chain(self, retriever, config: Optional[RAGConfig] = None):
        """
        Creates a complete RAG chain with history awareness using modern LangChain methods.
        This is the definitive fix.
        """
        if not retriever:
            raise ValueError("No retriever available. Please upload documents first.")

        llm = await self.llm_pool.get_llm()

        # 1. Create a chain to contextualize the user's question based on chat history.
        # This turns a follow-up question like "what about the first one?" into a standalone
        # question like "what about the first feature of the software development lifecycle?".
        contextualize_q_system_prompt = (
            "Given a chat history and the latest user question "
            "which might reference context in the chat history, "
            "formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, "
            "just reformulate it if needed and otherwise return it as is."
        )
        contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", contextualize_q_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

        # 2. Create the main prompt for answering the question using the retrieved context.
        # This prompt correctly includes the {context} placeholder.
        qa_system_prompt = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, just say that you don't know. "
            "Use three sentences maximum and keep the answer concise."
            "\n\n"
            "Context:\n{context}"
        )
        qa_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", qa_system_prompt),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )

        # 3. Create the chain that stuffs the retrieved documents into the prompt.
        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

        # 4. Combine the history-aware retriever and the answering chain.
        # This is the final, complete RAG chain.
        rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

        logger.info("Modern RAG chain created successfully.")
        return rag_chain

    async def create_regular_chain(self):
        """Creates a regular conversational chain without RAG."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}"),
        ])
        return prompt | self.llm | StrOutputParser()

    async def invoke_with_retry(self, chain, input_data: Dict[str, Any], session_config: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
        """Invoke chain with retry logic for rate limiting"""
        last_exception = None

        for attempt in range(max_retries):
            try:
                start_time = time.time()

                # Run in executor to avoid blocking
                result = await asyncio.get_event_loop().run_in_executor(
                    self.executor, lambda: chain.invoke(input_data, config=session_config)
                )

                # Add timing information
                if isinstance(result, dict):
                    result["response_time_ms"] = (time.time() - start_time) * 1000

                return result

            except OpenAI_RateLimitError as e:
                last_exception = e
                if attempt < max_retries + 10:
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limit hit, retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)

                    try:
                        # Try with a different LLM instance
                        new_llm = await self.llm_pool.get_random_llm()
                        logger.info("Switching to different LLM instance to retry")
                    except Exception:
                        pass
                    continue
                else:
                    logger.error(f"Max retries ({max_retries}) exceeded for rate limiting")
            except Exception as e:
                last_exception = e
                logger.error(f"Error in LLM invocation (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                    continue
                else:
                    break

        # If we exit retries with no success, raise the last exception
        if last_exception:
            raise last_exception
        raise RuntimeError("Unknown error in invoke_with_retry")

    async def get_embeddings(self) -> OpenAIEmbeddings:
        """Get embeddings instance"""
        return await self.embedding_service.get_embeddings()

    async def embed_query(self, query: str) -> List[float]:
        """Embed a query"""
        return await self.embedding_service.embed_query(query)

    async def health_check(self) -> Dict[str, Any]:
        """Check health of LLM service"""
        try:
            # Try to get an LLM instance
            llm = await self.llm_pool.get_llm()

            # Try a simple query
            test_prompt = ChatPromptTemplate.from_messages([("human", "Say 'OK' if you're working properly.")])
            test_chain = test_prompt | llm

            start_time = time.time()
            result = await asyncio.get_event_loop().run_in_executor(self.executor, lambda: test_chain.invoke({"input": "test"}))
            response_time = (time.time() - start_time) * 1000

            return {
                "status": "healthy",
                "pool_size": len(self.llm_pool._llm_pool),
                "response_time_ms": response_time,
                "test_response": result.content if hasattr(result, "content") else str(result),
            }

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def cleanup(self):
        """Cleanup resources"""
        self.executor.shutdown(wait=False)
        logger.info("LLM service cleaned up")


# Global service instance
_llm_service: Optional[LLMService] = None


async def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
        await _llm_service.llm_pool.initialize()
    return _llm_service
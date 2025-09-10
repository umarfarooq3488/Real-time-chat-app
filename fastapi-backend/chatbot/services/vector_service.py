import os
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import asyncio

# Pinecone imports (new SDK)
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_openai import OpenAIEmbeddings

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    CSVLoader,
    Docx2txtLoader,
    UnstructuredPowerPointLoader
)
from langchain.schema import Document
from langchain.vectorstores.base import VectorStore

# Your models
from chatbot.models.api_models import FileType, KnowledgeBaseInfo, SearchQuery, SearchResponse
from chatbot.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Vector store service using Pinecone with group-based isolation"""

    def __init__(self):
        self.pc: Optional[Pinecone] = None
        self.embeddings: Optional[OpenAIEmbeddings] = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

    async def initialize(self):
        """Initialize Pinecone client and embeddings once for the app"""
        if self.pc and self.embeddings:
            return
        try:
            api_key = os.getenv("PINECONE_API_KEY")
            if not api_key:
                raise ValueError("PINECONE_API_KEY not found in environment variables")
            self.pc = Pinecone(api_key=api_key)

            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            self.embeddings = OpenAIEmbeddings(
                openai_api_key=openai_api_key,
                model="text-embedding-ada-002"
            )
            logger.info("✅ Vector store service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize vector store service: {e}")
            raise

    def _get_index_name(self, group_id: str) -> str:
        """Generate index name for a group"""
        safe_group_id = group_id.lower().replace("_", "-").replace(" ", "-")
        base_name = os.getenv("PINECONE_INDEX_NAME", "chatbot-rag")
        return f"{base_name}-{safe_group_id}"

    async def _ensure_index_exists(self, group_id: str) -> str:
        """Ensure Pinecone index exists for the group"""
        index_name = self._get_index_name(group_id)
        loop = asyncio.get_event_loop()
        try:
            existing_indexes = await loop.run_in_executor(
                None, lambda: [idx["name"] for idx in self.pc.list_indexes()]
            )
            if index_name not in existing_indexes:
                logger.info(f"Creating new index: {index_name}")
                await loop.run_in_executor(
                    None,
                    lambda: self.pc.create_index(
                        name=index_name,
                        dimension=1536,
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud=os.getenv("PINECONE_CLOUD", "aws"),
                            region=os.getenv("PINECONE_REGION", "us-east-1")
                        )
                    )
                )
                # Wait until the index is ready
                while True:
                    status = await loop.run_in_executor(
                        None, lambda: self.pc.describe_index(index_name).status
                    )
                    if status.ready:
                        logger.info(f"Index {index_name} is ready.")
                        break
                    logger.info(f"Waiting for index {index_name} to be ready...")
                    await asyncio.sleep(5)
            return index_name
        except Exception as e:
            logger.error(f"Error ensuring index exists: {e}")
            raise

    def _load_document(self, file_path: str, file_type: FileType) -> List[Document]:
        """Load document based on file type"""
        try:
            if file_type == FileType.PDF:
                loader = PyPDFLoader(file_path)
            elif file_type == FileType.TXT:
                loader = TextLoader(file_path, encoding="utf-8")
            elif file_type == FileType.CSV:
                loader = CSVLoader(file_path)
            elif file_type in [FileType.DOC, FileType.DOCX]:
                loader = Docx2txtLoader(file_path)
            elif file_type in [FileType.PPT, FileType.PPTX]:
                loader = UnstructuredPowerPointLoader(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            return loader.load()
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {e}")
            raise

    def _get_vector_store(self, group_id: str) -> PineconeVectorStore:
        """Return a vector store bound to group namespace"""
        index_name = self._get_index_name(group_id)
        index = self.pc.Index(index_name)
        return PineconeVectorStore(
            index=index,
            embedding=self.embeddings,
            text_key="text",
            namespace=group_id
        )

    async def add_document(self, file_path: str, filename: str, file_type: FileType, group_id: str) -> Dict[str, Any]:
        """Add document to vector store"""
        logger.info(f"Starting document addition for group '{group_id}', file '{filename}'")
        await self.initialize()
        await self._ensure_index_exists(group_id)
        vector_store = self._get_vector_store(group_id)

        documents = self._load_document(file_path, file_type)
        chunks = self.text_splitter.split_documents(documents)
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "source_file": filename,
                "chunk_index": i,
                "group_id": group_id
            })

        logger.info(f"Adding {len(chunks)} chunks to Pinecone index in namespace '{group_id}'")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: vector_store.add_texts(
                texts=[chunk.page_content for chunk in chunks],
                metadatas=[chunk.metadata for chunk in chunks],
                namespace=group_id
            )
        )
        logger.info(f"✅ Successfully added {len(chunks)} chunks from {filename} to group {group_id}")
        return {"filename": filename, "chunk_count": len(chunks), "status": "success", "group_id": group_id}

    async def search_knowledge_base(self, search_query: SearchQuery, group_id: str) -> SearchResponse:
        """Search the knowledge base"""
        logger.info(f"KB search for group '{group_id}' with query '{search_query.query}'")
        await self.initialize()
        vector_store = self._get_vector_store(group_id)

        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(
            None,
            lambda: vector_store.similarity_search_with_score(
                search_query.query,
                k=search_query.top_k,
                namespace=group_id
            )
        )
        search_results = [
            {"content": doc.page_content, "metadata": doc.metadata, "score": float(score)}
            for doc, score in results
        ]
        return SearchResponse(query=search_query.query, results=search_results, total_results=len(search_results))

    async def get_knowledge_base_info(self, group_id: str) -> KnowledgeBaseInfo:
        """Get information about the knowledge base"""
        await self.initialize()
        index_name = self._get_index_name(group_id)
        loop = asyncio.get_event_loop()
        existing_indexes = await loop.run_in_executor(
            None, lambda: [idx["name"] for idx in self.pc.list_indexes()]
        )

        if index_name not in existing_indexes:
            return KnowledgeBaseInfo(total_documents=0, total_chunks=0, status="index_not_found")

        index = self.pc.Index(index_name)
        stats = await loop.run_in_executor(None, index.describe_index_stats)

        vector_count = 0
        if stats.namespaces and group_id in stats.namespaces:
            vector_count = stats.namespaces[group_id].vector_count

        estimated_docs = 1 if vector_count > 0 else 0

        return KnowledgeBaseInfo(
            total_documents=estimated_docs,
            total_chunks=vector_count,
            status="active" if vector_count > 0 else "empty"
        )

    async def get_retriever(self, group_id: str) -> Optional[VectorStore]:
        """Get a retriever for the specified group_id"""
        if not group_id:
            logger.warning("get_retriever called with no group_id.")
            return None
        try:
            vector_store = self._get_vector_store(group_id)
            return vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": settings.retrieval_k, "namespace": group_id}
            )
        except Exception as e:
            logger.error(f"Failed to get retriever for group '{group_id}': {e}")
            return None

    async def clear_knowledge_base(self, group_id: Optional[str]) -> Dict[str, Any]:
        """Clear all vectors from a namespace within an index"""
        await self.initialize()
        index_name = self._get_index_name(group_id)
        loop = asyncio.get_event_loop()
        existing_indexes = await loop.run_in_executor(
            None, lambda: [idx["name"] for idx in self.pc.list_indexes()]
        )

        if index_name in existing_indexes:
            index = self.pc.Index(index_name)
            await loop.run_in_executor(None, lambda: index.delete(delete_all=True, namespace=group_id))
            logger.info(f"Cleared knowledge base for group {group_id} in index {index_name}")

        return {"status": "success", "message": f"Knowledge base for group {group_id} cleared."}

    async def get_relevant_context(self, query: str, group_id: str, k: int = 3) -> List[str]:
        """Get relevant context for RAG"""
        try:
            search_query = SearchQuery(query=query, top_k=k)
            response = await self.search_knowledge_base(search_query, group_id)
            return [result.content for result in response.results]
        except Exception as e:
            logger.error(f"Error getting relevant context: {e}")
            return []


# Global service instance
_vector_service: Optional[VectorStoreService] = None

async def get_vector_service() -> VectorStoreService:
    """Get or create global vector service instance"""
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorStoreService()
        await _vector_service.initialize()
    return _vector_service

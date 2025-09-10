# Key Performance Optimizations for Your RAG Chatbot

import asyncio
from concurrent.futures import ThreadPoolExecutor
import time
from functools import lru_cache
from typing import Dict, Any, Optional
import psutil
import gc
from cachetools import TTLCache
from langchain.schema import BaseMessage
import logging
logger = logging.getLogger(__name__)

# 1. Response Caching Implementation
class ResponseCache:
    """Thread-safe response cache with TTL"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.cache = TTLCache(maxsize=max_size, ttl=ttl)
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return self.cache.get(key)
    
    async def set(self, key: str, value: Dict[str, Any]):
        async with self._lock:
            self.cache[key] = value
    
    def cache_key(self, user_id: str, message: str, use_rag: bool) -> str:
        """Generate cache key for request"""
        return f"{user_id}:{hash(message)}:{use_rag}"

# 2. Batch Document Processing
async def process_documents_batch(documents: list, batch_size: int = 5):
    """Process documents in batches for better performance"""
    results = []
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        
        # Process batch concurrently
        # tasks = [process_single_document(doc) for doc in batch]
        tasks = [process_single_document(doc) for doc in batch]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        results.extend(batch_results)
        
        # Small delay to prevent overwhelming the system
        if i + batch_size < len(documents):
            await asyncio.sleep(0.1)
    
    return results

async def process_single_document(doc):
    # TODO: Implement actual document processing logic
    return {"doc": doc, "status": "processed"}

# 3. Optimized Chat Endpoint with Caching
async def optimized_chat_endpoint(message: BaseMessage, response_cache: ResponseCache):
    """Optimized chat endpoint with caching and performance monitoring"""
    
    start_time = time.time()
    
    # Check cache first
    cache_key = response_cache.cache_key(message.user_id, message.message, message.use_rag)
    cached_response = await response_cache.get(cache_key)
    
    if cached_response:
        logger.info(f"Cache hit for user {message.user_id}")
        cached_response['response_time_ms'] = (time.time() - start_time) * 1000
        cached_response['from_cache'] = True
        return cached_response
    
    # Process request normally
    try:
        # Clear memory if usage is high
        memory_percent = psutil.virtual_memory().percent
        if memory_percent > 80:
            gc.collect()
            logger.warning(f"High memory usage ({memory_percent}%), forced garbage collection")
        
        # Your existing chat logic here...
        response = await process_chat_message(message)
        
        # Cache successful responses
        await response_cache.set(cache_key, response)
        
        response['response_time_ms'] = (time.time() - start_time) * 1000
        response['from_cache'] = False
        
        return response
        
    except Exception as e:
        logger.error(f"Error in chat processing: {str(e)}")
        raise

# 4. Vector Store Optimization
class OptimizedVectorStore:
    """Wrapper around Chroma with optimizations"""
    
    def __init__(self, vector_store):
        self.vector_store = vector_store
        self.search_cache = TTLCache(maxsize=500, ttl=1800)  # 30 minutes
        self._search_lock = asyncio.Lock()
    
    async def similarity_search_cached(self, query: str, k: int = 5):
        """Cached similarity search"""
        cache_key = f"{hash(query)}:{k}"
        
        async with self._search_lock:
            if cache_key in self.search_cache:
                return self.search_cache[cache_key]
        
        # Perform actual search
        results = await asyncio.get_event_loop().run_in_executor(
            None, self.vector_store.similarity_search, query, k
        )
        
        async with self._search_lock:
            self.search_cache[cache_key] = results
        
        return results
    
    async def add_documents_optimized(self, documents: list, batch_size: int = 50):
        """Add documents in optimized batches"""
        for i in range(0, len(documents), batch_size):
            batch = documents[i:i + batch_size]
            
            await asyncio.get_event_loop().run_in_executor(
                None, self.vector_store.add_documents, batch
            )
            
            # Optional persistence for backends that support it (e.g., Chroma)
            if hasattr(self.vector_store, 'persist') and i % (batch_size * 3) == 0:
                await asyncio.get_event_loop().run_in_executor(
                    None, self.vector_store.persist
                )

# 5. Connection Pool for Vector Operations
class VectorOperationPool:
    """Pool for vector operations to prevent blocking"""
    
    def __init__(self, max_workers: int = 3):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.semaphore = asyncio.Semaphore(max_workers)
    
    async def execute_vector_op(self, func, *args, **kwargs):
        """Execute vector operation with concurrency control"""
        async with self.semaphore:
            return await asyncio.get_event_loop().run_in_executor(
                self.executor, func, *args, **kwargs
            )

# 6. Optimized Document Processing Pipeline
class DocumentProcessor:
    """Optimized document processing with streaming and batching"""
    
    def __init__(self):
        self.text_splitter_cache = {}
        self.processing_stats = {
            'total_processed': 0,
            'average_time': 0,
            'cache_hits': 0
        }
    
    @lru_cache(maxsize=10)
    def get_text_splitter(self, chunk_size: int, chunk_overlap: int):
        """Cached text splitter instances"""
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        
        return RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    async def process_document_stream(self, file_path: str, file_type: str, 
                                    chunk_size: int = 1000, chunk_overlap: int = 200):
        """Process document with streaming for large files"""
        start_time = time.time()
        
        try:
            # Use appropriate loader based on file type
            if file_type == 'pdf':
                # For large PDFs, process page by page
                return await self._process_pdf_streaming(file_path, chunk_size, chunk_overlap)
            elif file_type == 'txt':
                return await self._process_text_streaming(file_path, chunk_size, chunk_overlap)
            else:
                # Fallback to regular processing for other types
                return await self._process_regular(file_path, file_type, chunk_size, chunk_overlap)
        
        finally:
            processing_time = time.time() - start_time
            self._update_stats(processing_time)
    
    async def _process_pdf_streaming(self, file_path: str, chunk_size: int, chunk_overlap: int):
        """Stream process PDF page by page"""
        from langchain_community.document_loaders import PyPDFLoader
        
        loader = PyPDFLoader(file_path)
        text_splitter = self.get_text_splitter(chunk_size, chunk_overlap)
        
        all_chunks = []
        
        # Process pages in batches
        async for page_batch in self._batch_pdf_pages(loader, batch_size=5):
            batch_chunks = await asyncio.get_event_loop().run_in_executor(
                None, text_splitter.split_documents, page_batch
            )
            all_chunks.extend(batch_chunks)
            
            # Yield control to prevent blocking
            await asyncio.sleep(0)
        
        return all_chunks
    
    async def _batch_pdf_pages(self, loader, batch_size: int = 5):
        """Generator for PDF pages in batches"""
        pages = await asyncio.get_event_loop().run_in_executor(None, loader.load)
        
        for i in range(0, len(pages), batch_size):
            yield pages[i:i + batch_size]
    
    def _update_stats(self, processing_time: float):
        """Update processing statistics"""
        self.processing_stats['total_processed'] += 1
        current_avg = self.processing_stats['average_time']
        total = self.processing_stats['total_processed']
        
        # Calculate running average
        self.processing_stats['average_time'] = (
            (current_avg * (total - 1) + processing_time) / total
        )

# 7. Memory Management Utilities
class MemoryManager:
    """Memory management utilities"""
    
    @staticmethod
    def get_memory_info():
        """Get current memory usage information"""
        memory = psutil.virtual_memory()
        return {
            'total_mb': memory.total / 1024 / 1024,
            'available_mb': memory.available / 1024 / 1024,
            'used_mb': memory.used / 1024 / 1024,
            'percent': memory.percent
        }
    
    @staticmethod
    async def cleanup_if_needed(threshold_percent: float = 80):
        """Cleanup memory if usage exceeds threshold"""
        memory_info = MemoryManager.get_memory_info()
        
        if memory_info['percent'] > threshold_percent:
            logger.warning(f"High memory usage: {memory_info['percent']:.1f}%")
            
            # Force garbage collection
            collected = gc.collect()
            logger.info(f"Garbage collected {collected} objects")
            
            # Additional cleanup if still high
            new_memory = psutil.virtual_memory().percent
            if new_memory > threshold_percent:
                logger.warning(f"Memory still high after GC: {new_memory:.1f}%")
                # Could implement additional cleanup strategies here
            
            return True
        return False

# 8. Performance Monitoring Decorator
def monitor_performance(func_name: str):
    """Decorator to monitor function performance"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            start_memory = psutil.virtual_memory().percent
            
            try:
                result = await func(*args, **kwargs)
                
                end_time = time.time()
                end_memory = psutil.virtual_memory().percent
                
                logger.info(f"{func_name} completed in {(end_time - start_time)*1000:.2f}ms, "
                          f"memory: {start_memory:.1f}% -> {end_memory:.1f}%")
                
                return result
            
            except Exception as e:
                end_time = time.time()
                logger.error(f"{func_name} failed after {(end_time - start_time)*1000:.2f}ms: {str(e)}")
                raise
        
        return wrapper
    return decorator

# 9. Optimized FastAPI Middleware
from fastapi import Request, Response
import json

class PerformanceMiddleware:
    """Middleware for performance monitoring and optimization"""
    
    def __init__(self, app):
        self.app = app
        self.request_stats = {
            'total_requests': 0,
            'average_response_time': 0,
            'cache_hits': 0,
            'error_count': 0
        }
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Add performance headers
                headers = dict(message.get("headers", []))
                headers[b"x-response-time"] = f"{(time.time() - start_time)*1000:.2f}ms".encode()
                message["headers"] = [(k, v) for k, v in headers.items()]
            
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
            self._update_stats(time.time() - start_time, success=True)
        except Exception as e:
            self._update_stats(time.time() - start_time, success=False)
            raise
    
    def _update_stats(self, response_time: float, success: bool):
        """Update request statistics"""
        self.request_stats['total_requests'] += 1
        if not success:
            self.request_stats['error_count'] += 1
        
        # Update running average
        total = self.request_stats['total_requests']
        current_avg = self.request_stats['average_response_time']
        self.request_stats['average_response_time'] = (
            (current_avg * (total - 1) + response_time) / total
        )

# 10. Usage Example - Optimized Main Application
async def create_optimized_app():
    """Create FastAPI app with all optimizations"""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Optimized RAG Chatbot")
    
    # Add performance middleware
    app.add_middleware(PerformanceMiddleware)
    
    # Add CORS with optimization
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Initialize global services
    response_cache = ResponseCache(max_size=1000, ttl=3600)
    document_processor = DocumentProcessor()
    memory_manager = MemoryManager()
    
    # Add to app state for access in endpoints
    app.state.response_cache = response_cache
    app.state.document_processor = document_processor
    app.state.memory_manager = memory_manager
    
    return app

# Quick implementation tips:
"""
1. Replace your current chat endpoint with optimized_chat_endpoint
2. Use OptimizedVectorStore wrapper around your Chroma instance
3. Add PerformanceMiddleware to your FastAPI app
4. Use DocumentProcessor for file uploads
5. Implement ResponseCache for frequently asked questions
6. Use monitor_performance decorator on critical functions
7. Regularly call MemoryManager.cleanup_if_needed()
8. Process documents in batches using process_documents_batch
9. Use VectorOperationPool for concurrent vector operations
10. Monitor memory usage and implement cleanup strategies
"""
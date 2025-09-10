# from fastapi import FastAPI, UploadFile, File, HTTPException
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# from fastapi.responses import JSONResponse
# from google.api_core.exceptions import ResourceExhausted
# from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
# from langchain_community.chat_message_histories import ChatMessageHistory
# from langchain_core.chat_history import BaseChatMessageHistory
# from langchain_core.runnables.history import RunnableWithMessageHistory
# from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
# from langchain_core.messages import BaseMessage
# from langchain_community.vectorstores import Chroma
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_community.document_loaders import (
#     PyPDFLoader, TextLoader, CSVLoader, 
#     UnstructuredWordDocumentLoader, UnstructuredPowerPointLoader
# )
# from langchain.chains import create_retrieval_chain
# from langchain.chains.combine_documents import create_stuff_documents_chain
# from langchain_core.documents import Document
# import os
# import random
# import shutil
# import tempfile
# from typing import Dict, List, Optional, Any
# from pathlib import Path
# import asyncio
# from concurrent.futures import ThreadPoolExecutor
# import logging

# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Load env vars
# load_dotenv()

# app = FastAPI(title="RAG-Enhanced Chatbot", version="1.0.0")

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"]
# )

# # Validate API keys
# api_keys = [
#     key for key in [
#         os.getenv("GOOGLE_API_KEY"),
#         os.getenv("GOOGLE_API_KEY_V2")
#     ] if key is not None
# ]

# if not api_keys:
#     raise ValueError("No valid Google API keys found in environment variables")

# # Initialize embeddings
# embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/embedding-001",
#     google_api_key=random.choice(api_keys)
# )

# # Global variables for RAG components
# vector_store = None
# retriever = None
# document_count = 0

# # Store for user chat histories
# user_store: Dict[str, ChatMessageHistory] = {}

# # Thread pool for async operations
# executor = ThreadPoolExecutor(max_workers=3)

# def get_session_history(session_id: str) -> BaseChatMessageHistory:
#     """Get or create chat history for a specific user session"""
#     if session_id not in user_store:
#         user_store[session_id] = ChatMessageHistory()
#     return user_store[session_id]

# def clear_session_history(session_id: str) -> None:
#     """Clear chat history for a specific user session"""
#     if session_id in user_store:
#         user_store[session_id].clear()

# def initialize_vector_store():
#     """Initialize Chroma vector store"""
#     global vector_store, retriever
    
#     persist_directory = "./chroma_db"
    
#     # Initialize Chroma
#     vector_store = Chroma(
#         persist_directory=persist_directory,
#         embedding_function=embeddings,
#         collection_name="knowledge_base"
#     )
    
#     # Create retriever with search parameters
#     retriever = vector_store.as_retriever(
#         search_type="similarity",
#         search_kwargs={
#             "k": 5  # Number of documents to retrieve
#         }
#     )
    
#     logger.info("Vector store initialized successfully")

# def load_document(file_path: str, file_type: str) -> List[Document]:
#     """Load document based on file type"""
#     try:
#         if file_type == 'pdf':
#             loader = PyPDFLoader(file_path)
#         elif file_type == 'txt':
#             loader = TextLoader(file_path, encoding='utf-8')
#         elif file_type == 'csv':
#             loader = CSVLoader(file_path)
#         elif file_type in ['doc', 'docx']:
#             loader = UnstructuredWordDocumentLoader(file_path)
#         elif file_type in ['ppt', 'pptx']:
#             loader = UnstructuredPowerPointLoader(file_path)
#         else:
#             raise ValueError(f"Unsupported file type: {file_type}")
        
#         return loader.load()
#     except Exception as e:
#         logger.error(f"Error loading document {file_path}: {str(e)}")
#         raise

# def split_documents(documents: List[Document]) -> List[Document]:
#     """Split documents into chunks"""
#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=1000,
#         chunk_overlap=200,
#         length_function=len,
#         separators=["\n\n", "\n", " ", ""]
#     )
    
#     return text_splitter.split_documents(documents)

# def create_rag_chain():
#     """Create RAG chain with retriever"""
#     global retriever
    
#     if not retriever:
#         raise HTTPException(status_code=400, detail="No knowledge base available. Please upload documents first.")
    
#     # Select random API key
#     selected_key = random.choice(api_keys)
    
#     # Initialize LLM
#     llm = ChatGoogleGenerativeAI(
#         model="models/gemini-1.5-flash",
#         google_api_key=selected_key,
#         temperature=0.7,
#     )
    
#     # Create system prompt for RAG
#     system_prompt = """You are a helpful AI assistant with access to a knowledge base. 
#     Use the following context to answer the user's question. If the context doesn't contain 
#     relevant information, use your general knowledge but mention that the information is not 
#     from the knowledge base.
    
#     Context: {context}
    
#     Instructions:
#     - Always prioritize information from the provided context
#     - If using general knowledge, clearly state so
#     - Be concise but comprehensive
#     - If you're unsure, say so rather than guessing
#     """
    
#     # Create prompt template
#     prompt = ChatPromptTemplate.from_messages([
#         ("system", system_prompt),
#         MessagesPlaceholder(variable_name="chat_history"),
#         ("human", "{input}")
#     ])
    
#     # Create document chain
#     question_answer_chain = create_stuff_documents_chain(llm, prompt)
    
#     # Create retrieval chain
#     rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
#     return rag_chain

# # Pydantic models
# class Message(BaseModel):
#     user_id: str
#     message: str
#     new_chat: bool = False
#     use_rag: bool = True

# class ChatResponse(BaseModel):
#     user_id: str
#     input: str
#     response: str
#     message_count: int
#     sources_used: Optional[List[str]] = None
#     rag_enabled: bool = False

# class DocumentInfo(BaseModel):
#     filename: str
#     file_type: str
#     chunk_count: int
#     status: str

# class KnowledgeBaseInfo(BaseModel):
#     document_count: int
#     total_chunks: int
#     status: str

# # Initialize vector store on startup
# @app.on_event("startup")
# async def startup_event():
#     """Initialize components on startup"""
#     try:
#         initialize_vector_store()
#         global document_count
#         if vector_store:
#             # Get existing document count
#             collection = vector_store._collection
#             document_count = collection.count()
#         logger.info("Application started successfully")
#     except Exception as e:
#         logger.error(f"Startup error: {str(e)}")

# @app.post("/upload", response_model=DocumentInfo)
# async def upload_document(file: UploadFile = File(...)):
#     """Upload and process document for RAG"""
#     global document_count, vector_store, retriever
    
#     try:
#         # Validate file type
#         allowed_extensions = ['.pdf', '.txt', '.csv', '.doc', '.docx', '.ppt', '.pptx']
#         file_extension = Path(file.filename).suffix.lower()
        
#         if file_extension not in allowed_extensions:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
#             )
        
#         # Save uploaded file temporarily
#         with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
#             content = await file.read()
#             tmp_file.write(content)
#             tmp_file_path = tmp_file.name
        
#         try:
#             # Load document
#             file_type = file_extension[1:]  # Remove the dot
#             documents = await asyncio.get_event_loop().run_in_executor(
#                 executor, load_document, tmp_file_path, file_type
#             )
            
#             # Split documents
#             chunks = await asyncio.get_event_loop().run_in_executor(
#                 executor, split_documents, documents
#             )
            
#             # Add metadata
#             for chunk in chunks:
#                 chunk.metadata.update({
#                     "source_file": file.filename,
#                     "file_type": file_type
#                 })
            
#             # Add to vector store
#             if not vector_store:
#                 initialize_vector_store()
            
#             await asyncio.get_event_loop().run_in_executor(
#                 executor, vector_store.add_documents, chunks
#             )
            
#             # Update retriever
#             retriever = vector_store.as_retriever(
#                 search_type="similarity",
#                 search_kwargs={"k": 5}
#             )
            
#             document_count += 1
            
#             return DocumentInfo(
#                 filename=file.filename,
#                 file_type=file_type,
#                 chunk_count=len(chunks),
#                 status="Successfully processed and added to knowledge base"
#             )
            
#         finally:
#             # Clean up temporary file
#             os.unlink(tmp_file_path)
            
#     except Exception as e:
#         logger.error(f"Error uploading document: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

# @app.post("/chat", response_model=ChatResponse)
# async def chat(message: Message):
#     """Enhanced chat endpoint with RAG capability"""
#     try:
#         # Validate input
#         if not message.user_id.strip():
#             raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
#         if not message.message.strip():
#             raise HTTPException(status_code=400, detail="message cannot be empty")

#         # Clear history if new chat is requested
#         if message.new_chat:
#             clear_session_history(message.user_id)

#         sources_used = []
#         rag_enabled = False
        
#         if message.use_rag and vector_store and document_count > 0:
#             # Use RAG chain
#             try:
#                 rag_chain = create_rag_chain()
                
#                 # Create a chain with message history
#                 chain_with_history = RunnableWithMessageHistory(
#                     rag_chain,
#                     get_session_history,
#                     input_messages_key="input",
#                     history_messages_key="chat_history",
#                     output_messages_key="answer"
#                 )
                
#                 # Invoke RAG chain
#                 result = await asyncio.get_event_loop().run_in_executor(
#                     executor,
#                     lambda: chain_with_history.invoke(
#                         {"input": message.message},
#                         config={"configurable": {"session_id": message.user_id}}
#                     )
#                 )
                
#                 response_text = result["answer"]
#                 rag_enabled = True
                
#                 # Extract source information
#                 if "context" in result:
#                     sources_used = list(set([
#                         doc.metadata.get("source_file", "Unknown")
#                         for doc in result["context"]
#                     ]))
                
#             except Exception as e:
#                 logger.error(f"RAG chain error: {str(e)}")
#                 # Fallback to regular chat
#                 message.use_rag = False
        
#         if not message.use_rag or not vector_store or document_count == 0:
#             # Use regular chat without RAG
#             selected_key = random.choice(api_keys)
            
#             prompt = ChatPromptTemplate.from_messages([
#                 ("system", "You are a helpful AI assistant. Respond naturally and helpfully to the user's questions."),
#                 MessagesPlaceholder(variable_name="history"),
#                 ("human", "{input}")
#             ])

#             llm = ChatGoogleGenerativeAI(
#                 model="models/gemini-1.5-flash",
#                 google_api_key=selected_key,
#                 temperature=0.7,
#             )

#             chain = RunnableWithMessageHistory(
#                 prompt | llm,
#                 get_session_history,
#                 input_messages_key="input",
#                 history_messages_key="history"
#             )

#             response = await asyncio.get_event_loop().run_in_executor(
#                 executor,
#                 lambda: chain.invoke(
#                     {"input": message.message},
#                     config={"configurable": {"session_id": message.user_id}}
#                 )
#             )
            
#             response_text = response.content

#         # Get current message count
#         current_history = get_session_history(message.user_id)
#         message_count = len(current_history.messages)

#         return ChatResponse(
#             user_id=message.user_id,
#             input=message.message,
#             response=response_text,
#             message_count=message_count,
#             sources_used=sources_used if sources_used else None,
#             rag_enabled=rag_enabled
#         )

#     except ResourceExhausted:
#         raise HTTPException(status_code=429, detail="API quota exceeded. Please try again later.")
#     except Exception as e:
#         logger.error(f"Error in chat endpoint: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# @app.get("/knowledge-base/info", response_model=KnowledgeBaseInfo)
# async def get_knowledge_base_info():
#     """Get information about the knowledge base"""
#     try:
#         global document_count, vector_store
        
#         total_chunks = 0
#         if vector_store:
#             collection = vector_store._collection
#             total_chunks = collection.count()
        
#         return KnowledgeBaseInfo(
#             document_count=document_count,
#             total_chunks=total_chunks,
#             status="active" if document_count > 0 else "empty"
#         )
#     except Exception as e:
#         logger.error(f"Error getting knowledge base info: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error retrieving knowledge base info: {str(e)}")

# @app.delete("/knowledge-base/clear")
# async def clear_knowledge_base():
#     """Clear the entire knowledge base"""
#     try:
#         global vector_store, retriever, document_count
        
#         if vector_store:
#             # Delete the collection
#             vector_store.delete_collection()
            
#             # Reinitialize
#             initialize_vector_store()
#             document_count = 0
        
#         return {"message": "Knowledge base cleared successfully", "status": "empty"}
        
#     except Exception as e:
#         logger.error(f"Error clearing knowledge base: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error clearing knowledge base: {str(e)}")

# @app.post("/knowledge-base/search")
# async def search_knowledge_base(query: str, top_k: int = 5):
#     """Search the knowledge base directly"""
#     try:
#         if not vector_store or document_count == 0:
#             raise HTTPException(status_code=400, detail="Knowledge base is empty")
        
#         # Perform similarity search
#         results = await asyncio.get_event_loop().run_in_executor(
#             executor,
#             lambda: vector_store.similarity_search_with_score(query, k=top_k)
#         )
        
#         search_results = []
#         for doc, score in results:
#             search_results.append({
#                 "content": doc.page_content[:500] + "..." if len(doc.page_content) > 500 else doc.page_content,
#                 "metadata": doc.metadata,
#                 "similarity_score": float(score)
#             })
        
#         return {
#             "query": query,
#             "results": search_results,
#             "total_found": len(search_results)
#         }
        
#     except Exception as e:
#         logger.error(f"Error searching knowledge base: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error searching knowledge base: {str(e)}")

# # Existing endpoints (keeping all previous functionality)
# @app.get("/chat/history/{user_id}")
# async def get_chat_history(user_id: str):
#     """Get chat history for a specific user"""
#     try:
#         if not user_id.strip():
#             raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
#         history = get_session_history(user_id)
#         messages = []
        
#         for msg in history.messages:
#             messages.append({
#                 "type": msg.type,
#                 "content": msg.content,
#                 "timestamp": getattr(msg, 'timestamp', None)
#             })
        
#         return {
#             "user_id": user_id,
#             "message_count": len(messages),
#             "messages": messages
#         }
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error retrieving history: {str(e)}")

# @app.delete("/chat/history/{user_id}")
# async def clear_chat_history(user_id: str):
#     """Clear chat history for a specific user"""
#     try:
#         if not user_id.strip():
#             raise HTTPException(status_code=400, detail="user_id cannot be empty")
        
#         clear_session_history(user_id)
        
#         return {
#             "user_id": user_id,
#             "message": "Chat history cleared successfully"
#         }
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error clearing history: {str(e)}")

# @app.get("/health")
# async def health_check():
#     """Health check endpoint"""
#     return {
#         "status": "healthy", 
#         "api_keys_available": len(api_keys),
#         "knowledge_base_status": "active" if document_count > 0 else "empty",
#         "documents_loaded": document_count
#     }

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
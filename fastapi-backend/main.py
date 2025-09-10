from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
from openai import OpenAI
import os
import re
import logging
from datetime import datetime, timezone
import uvicorn
import firebase_admin
from firebase_admin import credentials, firestore
import json
from dotenv import load_dotenv
from firebase_admin import firestore as fa_firestore

# RAG chatbot imports
from chatbot.models.api_models import Message as RAGMessage
from chatbot.services.chat_service import ChatService as RAGChatService
from chatbot.utils.performance_optimizations import ResponseCache
from chatbot.api.documents import router as documents_router
from chatbot.api.knowledge_base import router as kb_router
from chatbot.core.config import settings

# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Linkline Chat Bot API",
    description="AI Bot integration for university chat app",
    version="1.0.0"
)

# --- CORS ---
if settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )

# Shared state
app.state.response_cache = ResponseCache(max_size=1000, ttl=3600)
app.state.rag_service = None
app.state.chat_sessions: Dict[Tuple[str, str], str] = {}  # (group_id, user_id) -> session_id

# OpenAI config
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

# Firebase config
def get_firestore_client():
    try:
        if not firebase_admin._apps:
            # Get the JSON content from the environment variable for deployment
            firebase_creds_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if firebase_creds_json_str:
                firebase_creds_dict = json.loads(firebase_creds_json_str)
                cred = credentials.Certificate(firebase_creds_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully from environment variable.")
            else:
                # Fallback for local development (optional, but good practice)
                local_key_path = "chat_serviceAccountKey.json"
                if os.path.exists(local_key_path):
                    cred = credentials.Certificate(local_key_path)
                    firebase_admin.initialize_app(cred)
                    logger.info(f"Firebase initialized successfully from local file: {local_key_path}")
                else:
                    raise ValueError("Firebase credentials not found in environment variable or local file.")

        db = firestore.client()
    except Exception as e:
        logger.error(f"CRITICAL: Failed to initialize Firebase: {e}")
        db = None # Ensure db is defined even on failure
    return db


# Usage Limits
DAILY_GROUP_LIMIT = 10

def _today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

async def check_and_increment_usage(group_id: str, keyword: str) -> None:
    db = get_firestore_client()
    if not db or not group_id:
        return
    today = _today_str()
    doc_ref = db.collection("groups").document(group_id)
    try:
        snap = doc_ref.get()
        data = snap.to_dict() or {}
        ai_usage = data.get("aiUsage", {}) or {}
        date_key = ai_usage.get("dateKey")
        explain_calls = int(ai_usage.get("explainCallsToday", 0) or 0)
        notes_calls = int(ai_usage.get("notesCallsToday", 0) or 0)

        if date_key != today:
            explain_calls = notes_calls = 0
            date_key = today

        total_calls = explain_calls + notes_calls
        if total_calls >= DAILY_GROUP_LIMIT:
            raise HTTPException(status_code=429, detail="Daily AI limit reached")

        if keyword == "@explain":
            explain_calls += 1
        else:
            notes_calls += 1

        doc_ref.set(
            {
                "aiUsage": {
                    "dateKey": date_key,
                    "explainCallsToday": explain_calls,
                    "notesCallsToday": notes_calls,
                }
            },
            merge=True,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Usage limit check error: {str(e)}")
        return

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    group_id: str
    user_id: str
    username: str
    timestamp: Optional[datetime] = None
    context: Optional[list] = None

class BotResponse(BaseModel):
    response: str
    type: str = "aiResponse"
    bot_name: str
    timestamp: datetime
    group_id: str
    user_id: str
    username: str

class RAGRequest(BaseModel):
    query: str
    group_id: str
    user_id: str
    context: Optional[list] = None

# Bot config
BOT_KEYWORDS = {
    "@explain": {
        "name": "ExplainBot",
        "system_prompt": "You are an explanation assistant..."
    },
    "@help": {
        "name": "HelpBot",
        "system_prompt": "You are a helpful assistant using knowledge base..."
    }
}

def _get_rag_chat_service() -> RAGChatService:
    if app.state.rag_service is None:
        app.state.rag_service = RAGChatService()
    return app.state.rag_service

def detect_bot_mention(message: str) -> Optional[str]:
    for keyword in BOT_KEYWORDS.keys():
        if keyword in message.lower():
            return keyword
    return None

def extract_query_from_mention(message: str, keyword: str) -> str:
    query = message.replace(keyword, "").strip()
    return re.sub(r"\s+", " ", query) or "Hello! What would you like me to help with?"

async def get_openai_response(query: str, system_prompt: str, context: list = None) -> str:
    try:
        client = get_openai_client()
        messages = [{"role": "system", "content": system_prompt}]
        if context:
            ctx_msg = "Conversation context:\n"
            for msg in context[-10:]:
                role = "User" if msg.get("user_id") != "bot" else "Assistant"
                ctx_msg += f"{role}: {msg.get('message','')}\n"
            messages.append({"role": "system", "content": ctx_msg})
        messages.append({"role": "user", "content": query})

        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=400,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"Error fetching response: {str(e)}"

async def store_bot_message_in_firestore(bot_response: BotResponse):
    try:
        db = get_firestore_client()
        if not db:
            return
        message_data = {
            "text": bot_response.response,
            "name": bot_response.bot_name,
            "avatar": None,
            "createAt": fa_firestore.SERVER_TIMESTAMP,
            "id": "bot",
            "type": "aiResponse",
            "mentions": [],
        }
        db.collection("groups").document(bot_response.group_id).collection("messages").add(message_data)
    except Exception as e:
        print(f"Firestore store error: {str(e)}")

# --- Routers ---
app.include_router(documents_router, prefix="/rag", tags=["rag-documents"])
app.include_router(kb_router, prefix="/rag", tags=["rag-knowledge-base"])

@app.post("/chat", response_model=BotResponse)
async def explain_bot(message_data: ChatMessage):
    try:
        keyword = detect_bot_mention(message_data.message)
        if not keyword:
            raise HTTPException(status_code=400, detail="No supported bot mention")

        await check_and_increment_usage(message_data.group_id, keyword)
        bot_config = BOT_KEYWORDS[keyword]
        query = extract_query_from_mention(message_data.message, keyword)

        if keyword == "@explain":
            response_text = await get_openai_response(query, bot_config["system_prompt"], message_data.context)
        else:
            session_key = (message_data.group_id, message_data.user_id)
            session_id = app.state.chat_sessions.get(session_key)
            rag_message = RAGMessage(
                user_id=message_data.user_id,
                message=query,
                new_chat=session_id is None,
                use_rag=True,
                group_id=message_data.group_id,
                session_id=session_id
            )
            chat_service = _get_rag_chat_service()
            response_data = await chat_service.process_message(rag_message)

            response_text = response_data.get("response", "Sorry, I couldn't generate a response.")
            # update session
            if "session_id" in response_data:
                app.state.chat_sessions[session_key] = response_data["session_id"]

        bot_response = BotResponse(
            response=response_text,
            bot_name=bot_config["name"],
            timestamp=datetime.now(),
            group_id=message_data.group_id,
            user_id=message_data.user_id,
            username=message_data.username,
        )
        await store_bot_message_in_firestore(bot_response)
        return bot_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/rag")
async def rag_bot(request: RAGRequest):
    try:
        session_key = (request.group_id, request.user_id)
        session_id = app.state.chat_sessions.get(session_key)
        rag_message = RAGMessage(
            user_id=request.user_id,
            message=request.query,
            new_chat=session_id is None,
            use_rag=True,
            group_id=request.group_id,
            session_id=session_id
        )
        chat_service = _get_rag_chat_service()
        response_data = await chat_service.process_message(rag_message)
        if "session_id" in response_data:
            app.state.chat_sessions[session_key] = response_data["session_id"]

        return {
            "response": response_data.get("response"),
            "rag_enabled": response_data.get("rag_enabled", True),
            "sources_used": response_data.get("sources_used", []),
            "session_id": app.state.chat_sessions.get(session_key),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "API running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn, os
    port = int(os.environ.get("PORT", 8000))  # Railway provides PORT
    uvicorn.run("main:app", host="0.0.0.0", port=port)


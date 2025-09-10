from fastapi import APIRouter, UploadFile, File, HTTPException, Query
import tempfile
import os
from pathlib import Path

from chatbot.models.api_models import DocumentInfo, FileType
from chatbot.services.vector_service import get_vector_service

router = APIRouter(
    prefix="/knowledge-base",  # Add this prefix here
    tags=["RAG"]
)

_EXT_TO_FILETYPE = {
    ".pdf": FileType.PDF,
    ".txt": FileType.TXT,
    ".csv": FileType.CSV,
    ".doc": FileType.DOC,
    ".docx": FileType.DOCX,
    ".ppt": FileType.PPT,
    ".pptx": FileType.PPTX,
}

@router.post("/upload", response_model=DocumentInfo)
async def upload_document(file: UploadFile = File(...), group_id: str = Query(default="__default__")):
    """Upload and process document for RAG (per-group)"""

    # Validate file type
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in _EXT_TO_FILETYPE:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_extension}")

    file_type = _EXT_TO_FILETYPE[file_extension]

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        # Process document
        vector_service = await get_vector_service()
        result = await vector_service.add_document(tmp_file_path, file.filename, file_type, group_id)

        return DocumentInfo(
            filename=result["filename"],
            file_type=file_type,
            chunk_count=result["chunk_count"],
            status=result["status"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {e}")
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp_file_path)
        except Exception:
            pass
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.knowledge import KnowledgeDocument
from app.models.user import User
from app.rag.retriever import retrieve_relevant_documents
from app.schemas.knowledge import KnowledgeDocumentCreate, KnowledgeDocumentOut

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/", response_model=List[KnowledgeDocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(KnowledgeDocument).order_by(KnowledgeDocument.created_at.desc()).all()


@router.post("/", response_model=KnowledgeDocumentOut)
def create_document(
    payload: KnowledgeDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = KnowledgeDocument(title=payload.title, content=payload.content, category=payload.category)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"deleted": True}


@router.get("/search", response_model=List[KnowledgeDocumentOut])
def search_documents(query: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Preview what the RAG retriever would surface for a given query —
    useful for tuning knowledge base content."""
    return retrieve_relevant_documents(db, query, top_k=5, min_score=0.0)

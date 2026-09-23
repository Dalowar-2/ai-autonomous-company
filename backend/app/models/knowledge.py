from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text

from app.core.database import Base


class KnowledgeDocument(Base):
    """A single piece of company knowledge (rule, template, reference doc)
    that agents can retrieve as context before producing a deliverable."""
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, default="general")  # e.g. "company_rules", "template", "reference"
    created_at = Column(DateTime, default=datetime.utcnow)

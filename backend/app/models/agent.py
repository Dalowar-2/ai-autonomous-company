from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Agent(Base):
    """
    A row here represents one 'role' the system can invoke
    (Supervisor, Planner, Researcher, Developer, QA, Auditor, ...).
    The system_prompt defines how that role behaves.
    """
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g. "supervisor", "planner"
    display_name = Column(String, nullable=False)        # e.g. "AI Supervisor"
    description = Column(Text, default="")
    system_prompt = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    executions = relationship("AgentExecution", back_populates="agent")

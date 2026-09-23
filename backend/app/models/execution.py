import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExecutionStatus(str, enum.Enum):
    started = "started"
    succeeded = "succeeded"
    failed = "failed"


class AgentExecution(Base):
    """One log row per agent 'turn' taken while working on a task."""
    __tablename__ = "agent_executions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    input_text = Column(Text, nullable=False)
    output_text = Column(Text, default="")
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.started)
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="executions")
    agent = relationship("Agent", back_populates="executions")
    artifacts = relationship("Artifact", back_populates="execution", cascade="all, delete-orphan")

    @property
    def agent_name(self) -> str:
        return self.agent.display_name if self.agent else ""


class Artifact(Base):
    """Any concrete output produced by an execution (report text, code, etc.)."""
    __tablename__ = "artifacts"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("agent_executions.id"))
    name = Column(String, nullable=False)
    content_type = Column(String, default="text/plain")  # text/plain, text/markdown, application/json...
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    execution = relationship("AgentExecution", back_populates="artifacts")

import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class TaskStatus(str, enum.Enum):
    pending = "pending"
    planning = "planning"
    running = "running"
    needs_approval = "needs_approval"
    completed = "completed"
    failed = "failed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    instruction = Column(Text, nullable=False)  # the raw user instruction, e.g. "Build a report"
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    executions = relationship("AgentExecution", back_populates="task", cascade="all, delete-orphan")

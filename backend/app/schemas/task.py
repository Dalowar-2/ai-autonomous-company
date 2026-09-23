from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskStatus


class TaskCreate(BaseModel):
    title: str
    instruction: str
    project_id: int


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    instruction: str
    status: TaskStatus
    project_id: int
    created_at: datetime
    updated_at: datetime


class ExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    agent_id: int
    agent_name: Optional[str] = None
    input_text: str
    output_text: str
    status: str
    error_message: Optional[str] = ""
    created_at: datetime

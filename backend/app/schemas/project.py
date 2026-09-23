from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    status: ProjectStatus
    owner_id: int
    created_at: datetime

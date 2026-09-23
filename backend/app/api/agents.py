from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.agent import Agent
from app.models.user import User
from app.schemas.agent import AgentOut

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/", response_model=List[AgentOut])
def list_agents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Agent).all()

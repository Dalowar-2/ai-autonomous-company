from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.supervisor import run_task
from app.workflows.task_workflow import run_multi_agent_task
from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.execution import AgentExecution, Artifact
from app.models.task import Task
from app.models.user import User
from app.schemas.task import ExecutionOut, TaskCreate, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskOut])
def list_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Task).order_by(Task.created_at.desc()).all()


@router.post("/", response_model=TaskOut)
def create_task(payload: TaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = Task(title=payload.title, instruction=payload.instruction, project_id=payload.project_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.post("/{task_id}/execute", response_model=ExecutionOut)
def execute_task(
    task_id: int,
    mode: str = "multi",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Kicks off the autonomous execution loop for one task.

    mode="multi" (default): Planner -> specialist agents -> Supervisor synthesis
    -> QA review -> optional fix pass -> Auditor sign-off. Full chain, each step
    logged as its own execution + artifacts.

    mode="simple": the original single-Supervisor MVP loop (plan + deliverable
    in one call) — useful for quick smoke tests or when you want a cheaper,
    faster single LLM call instead of the full chain.

    Runs synchronously for simplicity; move to a background worker
    (Celery/RQ) once tasks take longer than a request timeout.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if mode == "simple":
        execution = run_task(task, db)
    else:
        execution = run_multi_agent_task(task, db)
    return execution


@router.get("/{task_id}/executions", response_model=List[ExecutionOut])
def get_executions(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AgentExecution).filter(AgentExecution.task_id == task_id).all()


@router.get("/executions/{execution_id}/artifacts")
def get_artifacts(execution_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    artifacts = db.query(Artifact).filter(Artifact.execution_id == execution_id).all()
    return [
        {"id": a.id, "name": a.name, "content_type": a.content_type, "content": a.content}
        for a in artifacts
    ]

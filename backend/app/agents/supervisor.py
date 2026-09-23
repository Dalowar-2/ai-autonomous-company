"""
MVP execution loop for a single task.

This is intentionally the *simplest* version of the architecture described
in the project plan: one "Supervisor" agent receives the raw instruction,
produces a short plan, then produces the final deliverable text, and both
get saved as Artifacts. Once this is solid, split it into
Planner -> Specialist -> QA -> Auditor agents that call each other.
"""
from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.execution import AgentExecution, ExecutionStatus, Artifact
from app.models.task import Task, TaskStatus
from app.services.llm_service import call_llm

SUPERVISOR_PROMPT = """You are the AI Supervisor of an autonomous company.
Given a single work instruction from a user, you must:
1. Write a short numbered plan (3-6 steps) for how you will complete it.
2. Then write "---DELIVERABLE---" on its own line.
3. Then produce the actual finished deliverable the user asked for
   (e.g. the report text, the code, the document content).
Be concrete and complete. Do not ask the user questions; make reasonable
assumptions and state them briefly at the top of the deliverable if needed.
"""


def run_task(task: Task, db: Session) -> AgentExecution:
    agent = db.query(Agent).filter(Agent.name == "supervisor").first()
    if agent is None:
        raise RuntimeError("Supervisor agent is not seeded in the database.")

    task.status = TaskStatus.running
    db.commit()

    execution = AgentExecution(
        task_id=task.id,
        agent_id=agent.id,
        input_text=task.instruction,
        status=ExecutionStatus.started,
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    try:
        output = call_llm(system_prompt=agent.system_prompt, user_message=task.instruction)

        execution.output_text = output
        execution.status = ExecutionStatus.succeeded
        db.add(execution)

        plan_part, _, deliverable_part = output.partition("---DELIVERABLE---")

        db.add(Artifact(
            execution_id=execution.id,
            name="plan.md",
            content_type="text/markdown",
            content=plan_part.strip() or "(no plan section returned)",
        ))
        db.add(Artifact(
            execution_id=execution.id,
            name="deliverable.md",
            content_type="text/markdown",
            content=(deliverable_part or output).strip(),
        ))

        task.status = TaskStatus.completed
        db.commit()

    except Exception as exc:  # noqa: BLE001 - we want to record any failure and keep the app alive
        execution.status = ExecutionStatus.failed
        execution.error_message = str(exc)
        task.status = TaskStatus.failed
        db.commit()

    db.refresh(execution)
    return execution

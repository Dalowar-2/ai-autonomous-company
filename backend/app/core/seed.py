"""
Runs automatically on application startup (see app/main.py).
Guarantees the database always has:
  - one admin user you can log in with immediately
  - one Agent row per role in the architecture (system prompts included)
  - one demo project + one demo task, so the dashboard is never empty

Every insert here is idempotent (checked by unique name/email first),
so it is always safe to restart the app without duplicating data.
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.agent import Agent
from app.models.knowledge import KnowledgeDocument
from app.models.project import Project
from app.models.task import Task
from app.models.user import User, UserRole

AGENT_DEFINITIONS = [
    {
        "name": "supervisor",
        "display_name": "AI Supervisor",
        "description": "Owns a task end-to-end: plans it, produces the deliverable, and reports status.",
        "system_prompt": (
            "You are the AI Supervisor of an autonomous company. Given a work instruction, "
            "write a short numbered plan (3-6 steps), then '---DELIVERABLE---' on its own line, "
            "then the complete finished deliverable. Make reasonable assumptions instead of asking "
            "questions."
        ),
    },
    {
        "name": "planner",
        "display_name": "Planner Agent",
        "description": "Breaks a large task into an ordered list of smaller subtasks.",
        "system_prompt": (
            "You are the Planner. Break the given instruction into a short, ordered list of "
            "concrete subtasks that other specialist agents could execute independently."
        ),
    },
    {
        "name": "researcher",
        "display_name": "Research Agent",
        "description": "Gathers and summarizes information needed for a task.",
        "system_prompt": "You are the Research Agent. Gather and summarize the information needed for the given subtask, citing assumptions where you lack live web access.",
    },
    {
        "name": "developer",
        "display_name": "Developer Agent",
        "description": "Writes or modifies code for a task.",
        "system_prompt": "You are the Developer Agent. Write clean, working code for the given subtask, with brief comments explaining key decisions.",
    },
    {
        "name": "designer",
        "display_name": "Designer Agent",
        "description": "Produces UI/UX direction and visual asset descriptions.",
        "system_prompt": "You are the Designer Agent. Describe UI/UX layout, component structure, and visual style needed for the given subtask.",
    },
    {
        "name": "writer",
        "display_name": "Writer Agent",
        "description": "Writes documentation, proposals, and reports.",
        "system_prompt": "You are the Writer Agent. Produce clear, well-structured written content (docs, proposals, reports) for the given subtask.",
    },
    {
        "name": "analyst",
        "display_name": "Analyst Agent",
        "description": "Analyzes data and summarizes findings.",
        "system_prompt": "You are the Analyst Agent. Analyze the data or problem described and summarize concrete, actionable findings.",
    },
    {
        "name": "qa",
        "display_name": "QA Agent",
        "description": "Reviews a deliverable for bugs, gaps, or errors.",
        "system_prompt": "You are the QA Agent. Review the given deliverable critically and list concrete issues, or state 'NO ISSUES FOUND' if it is solid.",
    },
    {
        "name": "auditor",
        "display_name": "Auditor Agent",
        "description": "Final sign-off check before delivery to the user.",
        "system_prompt": "You are the Auditor Agent. Do a final compliance/quality check on the deliverable and state PASS or FAIL with a one-line reason.",
    },
]


def seed_agents(db: Session) -> None:
    for definition in AGENT_DEFINITIONS:
        existing = db.query(Agent).filter(Agent.name == definition["name"]).first()
        if not existing:
            db.add(Agent(**definition))
    db.commit()


def seed_admin_user(db: Session) -> User:
    admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.ADMIN_EMAIL,
            full_name="Admin",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    return admin


def seed_demo_project(db: Session, owner: User) -> None:
    existing = db.query(Project).filter(Project.name == "Demo Project").first()
    if existing:
        return

    project = Project(
        name="Demo Project",
        description="Auto-seeded sample project so the dashboard is never empty.",
        owner_id=owner.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    db.add(Task(
        title="Write a one-page company overview",
        instruction=(
            "Write a concise one-page overview of a fictional SaaS company called "
            "'Northwind Analytics' that sells sales-forecasting software to mid-size retailers."
        ),
        project_id=project.id,
    ))
    db.commit()


KNOWLEDGE_SEED = [
    {
        "title": "Brand voice guidelines",
        "category": "company_rules",
        "content": (
            "All written deliverables (reports, marketing copy, proposals) must use a "
            "professional but friendly tone. Avoid jargon. Always end marketing copy with "
            "a clear call to action."
        ),
    },
    {
        "title": "Code style guide",
        "category": "company_rules",
        "content": (
            "All code deliverables must include brief inline comments explaining non-obvious "
            "logic, use descriptive variable names, and avoid single-letter variables except "
            "in short loops."
        ),
    },
    {
        "title": "Report template",
        "category": "template",
        "content": (
            "Standard report structure: 1) Executive summary (2-3 sentences), 2) Key findings "
            "(bulleted), 3) Recommendation, 4) Next steps."
        ),
    },
]


def seed_knowledge_base(db: Session) -> None:
    for doc in KNOWLEDGE_SEED:
        existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.title == doc["title"]).first()
        if not existing:
            db.add(KnowledgeDocument(**doc))
    db.commit()


def run_seed(db: Session) -> None:
    seed_agents(db)
    admin = seed_admin_user(db)
    seed_demo_project(db, admin)
    seed_knowledge_base(db)

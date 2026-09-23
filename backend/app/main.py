from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import agents, auth, knowledge, projects, tasks
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.seed import run_seed
import app.models  # noqa: F401  (ensures all models are registered on Base before create_all)

logger = logging.getLogger("ai_autonomous_company")


def _warn_on_insecure_defaults() -> None:
    """Loud startup warnings (never blocks startup) for settings that are
    fine for local dev but must not ship to production unchanged."""
    if settings.SECRET_KEY == "change-this-to-a-long-random-string":
        logger.warning(
            "SECURITY WARNING: SECRET_KEY is still the default value. "
            "Generate a real one, e.g.: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
        )
    if settings.ADMIN_PASSWORD == "Admin123!":
        logger.warning(
            "SECURITY WARNING: ADMIN_PASSWORD is still the default seeded value. "
            "Change it (and log in and update it) before exposing this instance publicly."
        )
    if settings.ALLOWED_ORIGINS.strip() == "*":
        logger.warning(
            "SECURITY WARNING: ALLOWED_ORIGINS is '*' (any website can call this API with credentials). "
            "Set it to your actual frontend domain(s) before deploying."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    _warn_on_insecure_defaults()
    # Create tables if they don't exist, then guarantee baseline data exists
    # (admin user, agent roles, one demo project/task) — no manual data entry needed.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title="AI Autonomous Company", version="0.1.0", lifespan=lifespan)

_allowed_origins = (
    ["*"] if settings.ALLOWED_ORIGINS.strip() == "*"
    else [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(agents.router)
app.include_router(knowledge.router)


@app.get("/health")
def health():
    """Liveness probe — the process is up. Doesn't touch the database."""
    return {"status": "ok"}


@app.get("/health/ready")
def readiness():
    """Readiness probe for load balancers / orchestrators — confirms the
    database is actually reachable, not just that the process started."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready"}
    except Exception as exc:  # noqa: BLE001
        return {"status": "not_ready", "error": str(exc)}

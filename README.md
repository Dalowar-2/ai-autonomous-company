# AI Autonomous Company — MVP

This is the working scaffold of the full multi-agent platform. It now
includes a real multi-agent execution chain:

```
Planner -> specialist agents (per subtask) -> Supervisor synthesis
        -> QA review -> (one fix pass if needed) -> Auditor sign-off
```

Every step is logged as its own `AgentExecution` row with `Artifact`s
attached, so the whole chain is inspectable afterwards.

`POST /tasks/{id}/execute` runs this chain by default. Pass
`?mode=simple` to use the original single-Supervisor MVP loop instead
(one LLM call for plan+deliverable — cheaper/faster for quick tests).

## What auto-seeds itself (no manual data entry)

On every startup the app will, if not already present:
- Create all database tables
- Create an **admin user** (from `.env`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Create one `Agent` row for every role in the architecture (supervisor,
  planner, researcher, developer, designer, writer, analyst, qa, auditor) —
  only "supervisor" is wired into execution right now, the rest are ready
  to be used once you split the execution loop into multiple agents
- Create one demo **Project** and one demo **Task** so the dashboard/API
  is never empty on first run

You never need to manually INSERT rows to try the system — just run it.

## Run locally (SQLite, fastest way to try it)

```bash
cd backend
cp ../.env.example .env      # then edit ANTHROPIC_API_KEY inside
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive API docs.

## Run with Docker (PostgreSQL + backend + frontend)

```bash
cp .env.example .env         # then edit ANTHROPIC_API_KEY inside
docker compose up --build
```

Backend: http://localhost:8000/docs · Frontend: http://localhost:5173

## Run the frontend locally (without Docker)

```bash
cd frontend
cp .env.example .env         # points at http://127.0.0.1:8000 by default
npm install
npm run dev
```

Open http://localhost:5173, sign in with the seeded admin account
(`admin@example.com` / `Admin123!`), and:
- **Dashboard** — overview stats and recent tasks
- **Projects** — create/list projects
- **Tasks** — create a task, hit **Execute**, then expand the row to watch
  the full agent chain (Planner → specialists → Supervisor → QA → Auditor)
  and inspect every artifact it produced
- **Agents** — the roster of agent roles
- **Knowledge base** — add/remove company rules & templates that agents
  retrieve as context (RAG) before producing a deliverable

## Run the Android app (Flutter)

A Flutter client with the same features as the web dashboard lives in
`mobile/`. See `mobile/README.md` for full setup — it needs the Flutter
SDK (not included here) and a couple of Android-specific steps
(generating platform folders, allowing cleartext HTTP for local dev).

## Deploying

See `DEPLOYMENT.md` for two full paths: managed platforms (Railway/Render
+ Vercel/Netlify, least setup) or a single self-hosted server (Docker
Compose + nginx, `docker-compose.prod.yml`), plus how to ship the mobile
app to Google Play.

## Try the end-to-end loop

1. `POST /auth/login` with the seeded admin email/password → get a token
2. `GET /projects/` → see the auto-seeded "Demo Project"
3. `GET /tasks/` → see the auto-seeded demo task
4. `POST /tasks/{task_id}/execute` → runs the full multi-agent chain
   (Planner → specialists → Supervisor synthesis → QA → Auditor)
5. `GET /tasks/{task_id}/executions` → see every step in the chain, in order
6. `GET /tasks/executions/{execution_id}/artifacts` → see the plan JSON,
   each subtask's output, the draft, QA review, and final deliverable

A task can end up `completed` (auditor said PASS) or `needs_approval`
(auditor said FAIL — a human should review before this ships anywhere).

Or create your own project/task via `POST /projects/` and `POST /tasks/`.

## What's deliberately NOT built yet (next steps)

- Background job queue (tasks currently execute synchronously inside
  the HTTP request — fine for a demo, not for long-running work;
  the multi-agent chain can take 15-30+ seconds since it's 4-6+ LLM calls)
- Approval gate for destructive/production actions (the `needs_approval`
  task status exists as a hook for this, but nothing currently blocks on it)
- Cost/rate limiting per task (the fix-pass loop is capped at 1 retry,
  but there's no overall token/cost budget yet)
- Semantic (embedding-based) search — the current retriever is pure
  keyword overlap, which is a deliberate zero-dependency starting point
  but won't scale to a large or synonym-heavy knowledge base
- User registration UI (the `/auth/register` endpoint exists, but the
  frontend only has a login screen wired up)

Build these incrementally on top of this scaffold rather than all at once.

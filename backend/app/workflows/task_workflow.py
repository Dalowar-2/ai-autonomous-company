
"""
Real multi-agent execution loop.

Flow:

    Planner
        ↓
    Specialists
        ↓
    Supervisor
        ↓
    QA
        ↓
    One Fix Pass
        ↓
    Auditor
        ↓
    Final Deliverable

Designed for local Ollama usage.
"""

import json
import re

from sqlalchemy.orm import Session

from app.models.agent import Agent
from app.models.execution import (
    AgentExecution,
    ExecutionStatus,
    Artifact,
)
from app.models.task import Task, TaskStatus

from app.rag.retriever import (
    retrieve_relevant_documents,
    format_context_block,
)

from app.services.llm_service import call_llm


# ============================================================
# 1. PLANNER PROMPT
# ============================================================

PLANNER_INSTRUCTION_TEMPLATE = """User instruction:

<USER_INSTRUCTION>
{instruction}
</USER_INSTRUCTION>

You are the Planner Agent in a real multi-agent autonomous company.

Your job is to divide the user's instruction into MULTIPLE independent
subtasks so that different specialist agents can work on different parts.

IMPORTANT RULES:

1. Create 3-5 subtasks for a complex request.

2. NEVER create only one subtask for a complex request.

3. Each subtask must cover a different part of the user's request.

4. Each subtask must have:
   - a clear title
   - a detailed instruction
   - one appropriate specialist agent

5. Available specialist roles:

   researcher = research and information gathering
   analyst = analysis, comparison, strategy, market analysis
   writer = writing, plans, documentation, proposals, content
   developer = software, code, technical implementation
   designer = UI/UX and visual design

6. Do not assign every subtask to the same agent unless absolutely necessary.

7. Make sure ALL major requirements of the original instruction are covered.

8. For a marketing strategy, separate the work into areas such as:
   - target customer research
   - market/competitor analysis
   - services and value proposition
   - marketing channels
   - action plan/content

9. Respond with ONLY valid JSON.

10. Do NOT use markdown code fences.

11. Do NOT add explanations before or after the JSON.

Required JSON format:

[
  {{
    "title": "short subtask title",
    "agent": "researcher",
    "instruction": "detailed instruction"
  }},
  {{
    "title": "short subtask title",
    "agent": "analyst",
    "instruction": "detailed instruction"
  }},
  {{
    "title": "short subtask title",
    "agent": "writer",
    "instruction": "detailed instruction"
  }}
]

Now create the best 3-5 independent subtasks for the user's instruction.
"""


# ============================================================
# 2. SUPERVISOR / SYNTHESIS PROMPT
# ============================================================

SYNTHESIS_INSTRUCTION_TEMPLATE = """Original user instruction:

<USER_INSTRUCTION>
{instruction}
</USER_INSTRUCTION>

The following specialist outputs were produced:

{subtask_outputs}

Create ONE complete final deliverable that directly answers the
original user instruction.

IMPORTANT RULES:

1. Use useful information from ALL specialist outputs.

2. Do NOT mention agents, specialists, subtasks, internal workflow,
   prompts, or this synthesis process.

3. Do NOT use placeholders.

4. Do NOT omit required parts of the original instruction.

5. Do NOT stop after only the first few sections.

6. Complete every section before ending the answer.

7. Use clear headings and practical details.

8. If specialist outputs conflict, use the most relevant and
   internally consistent information.

9. The final answer must be self-contained.

10. Do not intentionally truncate the answer.

For a marketing strategy request, include when applicable:

1. Introduction

2. Target Customers
   - target industries
   - customer types
   - customer needs
   - pain points

3. Key Services Offered
   - service names
   - what each service does
   - key features
   - customer benefits

4. Marketing Channels
   - channel/platform
   - target audience
   - content/activity
   - frequency
   - expected outcome

5. 30-Day Action Plan
   - Days 1-7
   - Days 8-14
   - Days 15-21
   - Days 22-30
   - specific activities
   - responsibilities

6. Market Analysis
   - competitive landscape
   - market trends
   - customer preferences
   - opportunities

Now produce the complete final deliverable.
"""


# ============================================================
# 3. QA PROMPT
# ============================================================

QA_INSTRUCTION_TEMPLATE = """Review the following deliverable against
the original user instruction.

Original instruction:

<USER_INSTRUCTION>
{instruction}
</USER_INSTRUCTION>

Deliverable:

<DELIVERABLE>
{deliverable}
</DELIVERABLE>

Check carefully for:

- missing required sections
- incomplete sections
- missing requested details
- contradictions
- obvious factual or logical problems
- unclear recommendations
- placeholders
- truncated sentences
- unfinished sections
- missing 30-day action plan when requested

If the deliverable fully satisfies the original instruction,
respond with exactly:

NO ISSUES FOUND

Otherwise, list the concrete issues that must be fixed.
"""


# ============================================================
# 4. FIX PROMPT
# ============================================================

FIX_INSTRUCTION_TEMPLATE = """Revise the current deliverable so that
it completely satisfies the original user instruction.

Original instruction:

<USER_INSTRUCTION>
{instruction}
</USER_INSTRUCTION>

Current deliverable:

<CURRENT_DELIVERABLE>
{deliverable}
</CURRENT_DELIVERABLE>

Reviewer feedback:

<REVIEW>
{feedback}
</REVIEW>

IMPORTANT RULES:

1. Fix every issue identified by the reviewer.

2. Preserve useful information already present.

3. Do NOT remove correct sections.

4. Do NOT mention the reviewer, QA, agents, or workflow.

5. Do NOT use placeholders.

6. Do NOT return only a list of changes.

7. Return the COMPLETE corrected deliverable.

8. Make sure every requested section is present.

9. Finish every section completely.

10. Do not intentionally truncate the answer.

Return only the final corrected deliverable.
"""


# ============================================================
# 5. AUDITOR PROMPT
# ============================================================

AUDIT_INSTRUCTION_TEMPLATE = """Perform a final quality and
compliance check.

Original instruction:

<USER_INSTRUCTION>
{instruction}
</USER_INSTRUCTION>

Final deliverable:

<DELIVERABLE>
{deliverable}
</DELIVERABLE>

Check whether the final deliverable:

- answers the original instruction
- contains all required sections
- is complete
- is coherent
- contains no obvious placeholders
- does not appear truncated
- contains requested action plan/details when applicable

Respond with exactly ONE line:

PASS: <short reason>

or

FAIL: <short reason>
"""


# ============================================================
# 6. GET AGENT
# ============================================================

def _get_agent(db: Session, name: str) -> Agent:
    """Return an agent by name."""

    agent = (
        db.query(Agent)
        .filter(Agent.name == name)
        .first()
    )

    if agent is None:
        raise RuntimeError(
            f"Agent '{name}' is not seeded in the database."
        )

    return agent


# ============================================================
# 7. LOG EXECUTION
# ============================================================

def _log_execution(
    db: Session,
    task_id: int,
    agent: Agent,
    input_text: str,
    output_text: str,
    status: ExecutionStatus,
    error_message: str = "",
) -> AgentExecution:

    execution = AgentExecution(
        task_id=task_id,
        agent_id=agent.id,
        input_text=input_text,
        output_text=output_text,
        status=status,
        error_message=error_message,
    )

    db.add(execution)
    db.commit()
    db.refresh(execution)

    return execution


# ============================================================
# 8. SAVE ARTIFACT
# ============================================================

def _save_artifact(
    db: Session,
    execution_id: int,
    name: str,
    content: str,
    content_type: str = "text/markdown",
):

    artifact = Artifact(
        execution_id=execution_id,
        name=name,
        content_type=content_type,
        content=content,
    )

    db.add(artifact)
    db.commit()


# ============================================================
# 9. PARSE PLANNER JSON
# ============================================================

def _parse_subtasks(raw: str) -> list[dict]:
    """
    Safely parse planner JSON.

    Handles:
    - normal JSON
    - markdown fences
    - extra text around JSON
    """

    if not raw:
        return []

    raw = raw.strip()

    # First attempt: direct JSON
    try:
        subtasks = json.loads(raw)

        if isinstance(subtasks, list):
            return subtasks

    except (json.JSONDecodeError, TypeError):
        pass

    # Remove markdown fences
    cleaned = re.sub(
        r"```(?:json)?",
        "",
        raw,
        flags=re.IGNORECASE,
    )

    cleaned = cleaned.replace("```", "").strip()

    # Second attempt
    try:
        subtasks = json.loads(cleaned)

        if isinstance(subtasks, list):
            return subtasks

    except (json.JSONDecodeError, TypeError):
        pass

    # Find JSON array inside surrounding text
    match = re.search(
        r"\[.*\]",
        cleaned,
        re.DOTALL,
    )

    if match:

        candidate = match.group(0)

        try:
            subtasks = json.loads(candidate)

            if isinstance(subtasks, list):
                return subtasks

        except (json.JSONDecodeError, TypeError):
            pass

    return []


# ============================================================
# 10. CLEAN SUBTASKS
# ============================================================

def _clean_subtasks(
    subtasks: list[dict],
    original_instruction: str,
) -> list[dict]:

    valid_agents = {
        "researcher",
        "developer",
        "designer",
        "writer",
        "analyst",
    }

    cleaned = []

    for item in subtasks:

        if not isinstance(item, dict):
            continue

        title = str(
            item.get("title", "")
        ).strip()

        agent_name = str(
            item.get("agent", "writer")
        ).strip().lower()

        instruction = str(
            item.get("instruction", "")
        ).strip()

        if not title:
            title = "Complete subtask"

        if agent_name not in valid_agents:
            agent_name = "writer"

        if not instruction:
            instruction = original_instruction

        cleaned.append(
            {
                "title": title,
                "agent": agent_name,
                "instruction": instruction,
            }
        )

    return cleaned


# ============================================================
# 11. ENSURE MULTIPLE SPECIALISTS
# ============================================================

def _ensure_multiple_specialists(
    subtasks: list[dict],
    original_instruction: str,
) -> list[dict]:
    """
    Guarantees at least 3 specialist subtasks for a complex task.

    If the LLM returns only one or two subtasks, safe specialist
    subtasks are added automatically.
    """

    if len(subtasks) >= 3:
        return subtasks[:5]

    instruction_lower = original_instruction.lower()

    # Existing roles
    existing_agents = {
        item.get("agent")
        for item in subtasks
    }

    # Candidate specialist subtasks
    candidates = []

    if any(
        word in instruction_lower
        for word in [
            "research",
            "market",
            "customer",
            "competitor",
            "industry",
        ]
    ):
        candidates.append(
            {
                "title": "Research and Market Analysis",
                "agent": "researcher",
                "instruction": (
                    "Research the target customers, relevant market, "
                    "industry context, customer needs, competitors, "
                    "and useful opportunities related to this request. "
                    f"Original request: {original_instruction}"
                ),
            }
        )

    if any(
        word in instruction_lower
        for word in [
            "strategy",
            "analysis",
            "pricing",
            "business",
            "plan",
            "channel",
        ]
    ):
        candidates.append(
            {
                "title": "Strategy and Analysis",
                "agent": "analyst",
                "instruction": (
                    "Analyze the requirements, strategy, options, "
                    "risks, opportunities, positioning, and practical "
                    "approach for this request. "
                    f"Original request: {original_instruction}"
                ),
            }
        )

    if any(
        word in instruction_lower
        for word in [
            "design",
            "ui",
            "ux",
            "interface",
        ]
    ):
        candidates.append(
            {
                "title": "Design Planning",
                "agent": "designer",
                "instruction": (
                    "Define the relevant UI, UX, visual structure, "
                    "and design requirements for this request. "
                    f"Original request: {original_instruction}"
                ),
            }
        )

    if any(
        word in instruction_lower
        for word in [
            "code",
            "software",
            "app",
            "website",
            "api",
            "system",
            "develop",
            "build",
        ]
    ):
        candidates.append(
            {
                "title": "Technical Implementation",
                "agent": "developer",
                "instruction": (
                    "Analyze the technical implementation, "
                    "architecture, software requirements, and "
                    "development approach for this request. "
                    f"Original request: {original_instruction}"
                ),
            }
        )

    # Always keep a writing specialist available
    candidates.append(
        {
            "title": "Final Content and Action Plan",
            "agent": "writer",
            "instruction": (
                "Develop the written content, practical action plan, "
                "structure, recommendations, and deliverable needed "
                "for the original request. "
                f"Original request: {original_instruction}"
            ),
        }
    )

    # Add candidates that are not already represented
    for candidate in candidates:

        if len(subtasks) >= 3:
            break

        if candidate["agent"] not in existing_agents:

            subtasks.append(candidate)
            existing_agents.add(
                candidate["agent"]
            )

    # If still fewer than 3, add generic analyst/researcher/writer
    fallback_roles = [
        (
            "researcher",
            "Research Requirements",
            "Research the important information needed for the request."
        ),
        (
            "analyst",
            "Analyze Requirements",
            "Analyze the requirements, strategy, risks, and practical approach."
        ),
        (
            "writer",
            "Prepare Deliverable",
            "Prepare the written deliverable and practical recommendations."
        ),
    ]

    for agent_name, title, description in fallback_roles:

        if len(subtasks) >= 3:
            break

        if agent_name not in existing_agents:

            subtasks.append(
                {
                    "title": title,
                    "agent": agent_name,
                    "instruction": (
                        f"{description} "
                        f"Original request: {original_instruction}"
                    ),
                }
            )

            existing_agents.add(agent_name)

    return subtasks[:5]


# ============================================================
# 12. MAIN MULTI-AGENT WORKFLOW
# ============================================================

def run_multi_agent_task(
    task: Task,
    db: Session,
) -> AgentExecution:

    """
    Execute:

        Planner
        → Specialists
        → Supervisor
        → QA
        → One Fix Pass
        → Auditor
    """

    task.status = TaskStatus.planning
    db.commit()

    # --------------------------------------------------------
    # Load required agents
    # --------------------------------------------------------

    supervisor = _get_agent(
        db,
        "supervisor",
    )

    planner = _get_agent(
        db,
        "planner",
    )

    qa = _get_agent(
        db,
        "qa",
    )

    auditor = _get_agent(
        db,
        "auditor",
    )

    try:

        # ====================================================
        # STEP 1: PLAN
        # ====================================================

        plan_input = (
            PLANNER_INSTRUCTION_TEMPLATE.format(
                instruction=task.instruction,
            )
        )

        plan_raw = call_llm(
            system_prompt=planner.system_prompt,
            user_message=plan_input,
            max_tokens=512,
        )

        plan_execution = _log_execution(
            db=db,
            task_id=task.id,
            agent=planner,
            input_text=plan_input,
            output_text=plan_raw,
            status=ExecutionStatus.succeeded,
        )

        _save_artifact(
            db=db,
            execution_id=plan_execution.id,
            name="plan.json",
            content=plan_raw,
            content_type="application/json",
        )

        # Parse
        subtasks = _parse_subtasks(
            plan_raw
        )

        # Clean
        subtasks = _clean_subtasks(
            subtasks,
            task.instruction,
        )

        # IMPORTANT:
        # Force minimum 3 specialists
        subtasks = _ensure_multiple_specialists(
            subtasks,
            task.instruction,
        )

        # Final safety
        if not subtasks:

            subtasks = [
                {
                    "title": "Research Requirements",
                    "agent": "researcher",
                    "instruction": task.instruction,
                },
                {
                    "title": "Analyze Requirements",
                    "agent": "analyst",
                    "instruction": task.instruction,
                },
                {
                    "title": "Prepare Deliverable",
                    "agent": "writer",
                    "instruction": task.instruction,
                },
            ]

        subtasks = subtasks[:5]

        # ====================================================
        # STEP 2: SPECIALISTS
        # ====================================================

        task.status = TaskStatus.running
        db.commit()

        subtask_outputs = []

        for index, subtask in enumerate(
            subtasks,
            start=1,
        ):

            agent_name = subtask.get(
                "agent",
                "writer",
            )

            specialist = (
                db.query(Agent)
                .filter(
                    Agent.name == agent_name
                )
                .first()
            )

            # Fallback to writer
            if specialist is None:

                specialist = _get_agent(
                    db,
                    "writer",
                )

            subtask_instruction = subtask.get(
                "instruction",
                task.instruction,
            )

            # ------------------------------------------------
            # RAG retrieval
            # ------------------------------------------------

            relevant_docs = (
                retrieve_relevant_documents(
                    db,
                    subtask_instruction,
                    top_k=2,
                )
            )

            context_block = format_context_block(
                relevant_docs
            )

            if context_block:

                prompt = (
                    context_block
                    + "\n\n"
                    + subtask_instruction
                )

            else:

                prompt = subtask_instruction

            # ------------------------------------------------
            # Specialist LLM
            # ------------------------------------------------

            output = call_llm(
                system_prompt=specialist.system_prompt,
                user_message=prompt,
                max_tokens=384,
            )

            execution = _log_execution(
                db=db,
                task_id=task.id,
                agent=specialist,
                input_text=prompt,
                output_text=output,
                status=ExecutionStatus.succeeded,
            )

            # ------------------------------------------------
            # Artifact
            # ------------------------------------------------

            artifact_name = (
                f"subtask_{index}_{specialist.name}.md"
            )

            _save_artifact(
                db=db,
                execution_id=execution.id,
                name=artifact_name,
                content=output,
            )

            # ------------------------------------------------
            # RAG context artifact
            # ------------------------------------------------

            if relevant_docs:

                context_artifact_name = (
                    f"retrieved_context_{index}_"
                    f"{specialist.name}.md"
                )

                context_content = "\n".join(
                    f"- {doc.title} ({doc.category})"
                    for doc in relevant_docs
                )

                _save_artifact(
                    db=db,
                    execution_id=execution.id,
                    name=context_artifact_name,
                    content=context_content,
                )

            # ------------------------------------------------
            # Add specialist output
            # ------------------------------------------------

            subtask_title = subtask.get(
                "title",
                specialist.name,
            )

            subtask_outputs.append(
                f"### {subtask_title} "
                f"({specialist.name})\n"
                f"{output}"
            )

        # ====================================================
        # STEP 3: SUPERVISOR
        # ====================================================

        synthesis_input = (
            SYNTHESIS_INSTRUCTION_TEMPLATE.format(
                instruction=task.instruction,
                subtask_outputs="\n\n".join(
                    subtask_outputs
                ),
            )
        )

        deliverable = call_llm(
            system_prompt=supervisor.system_prompt,
            user_message=synthesis_input,
            max_tokens=768,
        )

        synth_execution = _log_execution(
            db=db,
            task_id=task.id,
            agent=supervisor,
            input_text=synthesis_input,
            output_text=deliverable,
            status=ExecutionStatus.succeeded,
        )

        _save_artifact(
            db=db,
            execution_id=synth_execution.id,
            name="draft_deliverable.md",
            content=deliverable,
        )

        # ====================================================
        # STEP 4: QA
        # ====================================================

        qa_input = QA_INSTRUCTION_TEMPLATE.format(
            instruction=task.instruction,
            deliverable=deliverable,
        )

        qa_feedback = call_llm(
            system_prompt=qa.system_prompt,
            user_message=qa_input,
            max_tokens=256,
        )

        qa_execution = _log_execution(
            db=db,
            task_id=task.id,
            agent=qa,
            input_text=qa_input,
            output_text=qa_feedback,
            status=ExecutionStatus.succeeded,
        )

        _save_artifact(
            db=db,
            execution_id=qa_execution.id,
            name="qa_review.md",
            content=qa_feedback,
        )

        # ====================================================
        # STEP 5: ONE FIX PASS
        # ====================================================

        if "NO ISSUES FOUND" not in qa_feedback.upper():

            writer = _get_agent(
                db,
                "writer",
            )

            fix_input = FIX_INSTRUCTION_TEMPLATE.format(
                instruction=task.instruction,
                deliverable=deliverable,
                feedback=qa_feedback,
            )

            deliverable = call_llm(
                system_prompt=writer.system_prompt,
                user_message=fix_input,
                max_tokens=768,
            )

            fix_execution = _log_execution(
                db=db,
                task_id=task.id,
                agent=writer,
                input_text=fix_input,
                output_text=deliverable,
                status=ExecutionStatus.succeeded,
            )

            _save_artifact(
                db=db,
                execution_id=fix_execution.id,
                name="revised_deliverable.md",
                content=deliverable,
            )

        # ====================================================
        # STEP 6: FINAL AUDIT
        # ====================================================

        audit_input = AUDIT_INSTRUCTION_TEMPLATE.format(
            instruction=task.instruction,
            deliverable=deliverable,
        )

        audit_verdict = call_llm(
            system_prompt=auditor.system_prompt,
            user_message=audit_input,
            max_tokens=128,
        )

        audit_execution = _log_execution(
            db=db,
            task_id=task.id,
            agent=auditor,
            input_text=audit_input,
            output_text=audit_verdict,
            status=ExecutionStatus.succeeded,
        )

        _save_artifact(
            db=db,
            execution_id=audit_execution.id,
            name="audit_verdict.md",
            content=audit_verdict,
        )

        # Final deliverable
        _save_artifact(
            db=db,
            execution_id=audit_execution.id,
            name="final_deliverable.md",
            content=deliverable,
        )

        # ====================================================
        # FINAL STATUS
        # ====================================================

        if audit_verdict.upper().startswith("PASS"):

            task.status = TaskStatus.completed

        else:

            task.status = TaskStatus.needs_approval

        db.commit()

        return audit_execution

    # ========================================================
    # GLOBAL ERROR HANDLER
    # ========================================================

    except Exception as exc:

        task.status = TaskStatus.failed
        db.commit()

        return _log_execution(
            db=db,
            task_id=task.id,
            agent=supervisor,
            input_text=task.instruction,
            output_text="",
            status=ExecutionStatus.failed,
            error_message=str(exc),
        )


---
name: superpowers-workflow
description: >-
  Superpowers-style brainstorm → design → plan → implement for DisasterTraining.
  Use when starting a new feature, unclear requirements, multi-file changes, or
  when the user asks to plan before coding.
---

# Superpowers Workflow

Adapt [obra/superpowers](https://github.com/obra/superpowers) for this project.

## When to use

- New feature or module change
- User idea is vague (“gawing mas maganda”, “ayusin yung flow”)
- Work will touch backend + frontend

## Steps

### 1. Brainstorm (before code)

- Restate the goal in product terms (admin vs participant).
- List 1–3 options with trade-offs.
- Pick one default recommendation.
- Confirm with the user only if the choice is irreversible or ambiguous.

### 2. Design slice

Keep it short:

```markdown
## Goal
## User flow (before → after)
## Files to touch
## Out of scope
## Done when
```

### 3. Implementation plan

Tasks of ~2–10 minutes each. Every task includes:

- File path(s)
- What to change
- How to verify (UI click path or `php -l` / page check)

### 4. Execute

- One task at a time.
- No unrelated cleanup.
- After each major chunk, sanity-check the campaign → plan → event → monitoring path if touched.

### 5. Finish

- Summarize what changed and how to test.
- Do not commit unless the user asked.

## Project constraints

- Template-created events skip the old edit form → readiness/monitoring.
- Event timeline times must shift from **event start time**, not copy template clock blindly.
- Qualified campaign participants auto-register; no Hazard Scenario checklist item.

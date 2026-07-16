---
name: context-mode
description: >-
  Context Mode habits for token-efficient work in DisasterTraining. Use on large
  codebase searches, noisy tool output, or when context is getting crowded.
---

# Context Mode

Habits inspired by [context-mode](https://github.com/mksglu/context-mode): keep the working set small and relevant.

## Principles

1. **Search first, read second** — Grep/Glob before opening whole files.
2. **Slice reads** — use offset/limit; pull only the function you need.
3. **Prefer project map** — reuse known module paths from workflow rules.
4. **Compress tool noise** — summarize long shell/log output; keep errors + next action.
5. **One concern per pass** — finish one vertical slice before opening unrelated modules.

## Do

- Target `my-app/app/Services/…` and `my-app/resources/js/…` narrowly.
- Parallelize independent Grep/Glob calls.
- Drop irrelevant files from working memory after the change.

## Don’t

- Dump entire controllers/services into chat.
- Re-read the same 800-line file repeatedly — cache the relevant section.
- Expand scope “while we’re here.”

## Quick anchors for this repo

| Need | Start here |
|------|------------|
| Reuse / timeline shift | `SimulationExerciseTemplateService::reuseTemplate` |
| Readiness checklist | `SimulationEventLifecycleService::buildReadinessChecklist` |
| Campaign qualification | `SimulationEventPlanningService` |
| Monitoring UI | `SimulationEventLifecyclePage.jsx` |
| Approved campaigns table | `ApprovedCampaignSchedulesTable.jsx` |

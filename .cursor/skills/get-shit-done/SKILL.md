---
name: get-shit-done
description: >-
  Spec-driven Get Shit Done (GSD) workflow for DisasterTraining. Use when the
  user wants a clear spec, checklist plan, or disciplined ship of a feature
  without fluff.
---

# Get Shit Done (GSD)

Light-weight spec → execute → verify loop adapted from GSD / Open GSD Core ideas.

## Output templates

### Spec (max ~20 lines)

```markdown
## Problem
## Desired outcome
## In scope
## Out of scope
## Acceptance criteria
- [ ] ...
```

### Execution checklist

```markdown
- [ ] 1. ... (`path/to/file`)
- [ ] 2. ...
- [ ] Verify: ...
```

## Rules

1. **Write the spec first** for anything beyond a one-line fix.
2. **Ship the checklist** — do not invent extra polish mid-flight.
3. **One vertical slice** — prefer end-to-end thin over half-finished layers.
4. **Evidence** — mark verify items only after checking, not assuming.
5. **Stop at done** — no bonus refactors.

## DisasterTraining defaults

When the request is about Simulation Event Planning, default acceptance includes:

- Approved campaign can **Use Template**
- New event opens **Readiness** (not edit form) when from exercise plan
- **Publish** lands on **Monitoring**
- Timeline times match **event date + start time**

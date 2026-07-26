# Task 4 Report: Readiness per-role assign UI

**Status:** DONE  
**Branch:** `feature/readiness-personnel-assignment`  
**Date:** 2026-07-26  
**Commits:** none

## Summary

Readiness tab now assigns LGU/trainer roles from `lifecycle.assignment_pools` via `RoleAssignmentPanel`. Save uses merge-safe `PUT .../personnel-assignments` with `replace_roles`. CPSQC marshal panel unchanged (Marshal-only rows). Roster remains a read-only summary.

## Files changed

| Action | Path |
|--------|------|
| Modified | `my-app/resources/js/components/SimulationEventLifecyclePage.jsx` |

## Implementation details

### `RoleAssignmentPanel`

- Renders each `assignment_pools` entry except Marshal.
- Up to `recommended_count` `<select>` slots; options show `name — position`.
- Prefills from `assigned` via `qualified_trainer_id` / `person_external_id`.
- Blocks duplicate person selection across slots for the same role.
- **Save Personnel Assignments** builds:
  - trainers → `source_group: group6_trainers`, `qualified_trainer_id`, `person_name`
  - staff → `source_group: lgu_staff`, `person_external_id`, `person_name`
- PUT body: `{ assignments, replace_roles }` so cleared slots wipe those roles without touching marshals.
- On success: `onLifecycleUpdate(data.lifecycle)` + Swal success.

### Readiness placement

1. Role assignment panel (exercise-plan events)
2. Personnel roster (read-only summary; copy updated)
3. Existing `CpsqcMarshalPanel` (request / refresh / Marshal-only save)

## Verification

### Structure / grep

- `RoleAssignmentPanel`, `Save Personnel Assignments`, `assignment_pools`, `replace_roles` present.
- `Save Marshal Assignments` still present; marshal payload still `role: 'Marshal'` / `cpsqc_patrol` only.

### Manual UI

Not opened in browser this run; wiring matches Task 2 pool payload and merge API.

## Concerns

- Prefill only works when the assigned person is still in `members` (backend includes event assignees, so normal case is fine).
- Clearing all slots and saving relies on `replace_roles`; without it empty saves would not clear roles.
- UI not browser-tested in this run.

## Acceptance

- [x] Per-role selectors from `assignment_pools`
- [x] Save LGU/trainer assignments via PUT personnel-assignments
- [x] CpsqcMarshalPanel kept (marshal-only merge-safe save)
- [x] Order: assign panel → roster → CPSQC; copy updated
- [x] No commit

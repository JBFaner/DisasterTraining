# Task 2 Report: Lifecycle service — pools, sync, release

**Status:** DONE  
**Branch:** `feature/readiness-personnel-assignment`  
**Date:** 2026-07-26  
**Commits:** none

## Summary

Expanded `SimulationEventLifecycleService` with assignment pools, merge-by-role personnel sync (status flips), and release-on-complete/cancel. Payload now includes `assignment_pools` and readiness checklist item `personnel_roles_assigned`. CPSQC marshal flow unchanged aside from merge-safe saves.

## Files changed

| Action | Path |
|--------|------|
| Modified | `my-app/app/Services/SimulationEventLifecycleService.php` |
| Modified | `my-app/app/Http/Controllers/SimulationEventLifecycleController.php` |
| Modified | `my-app/app/Http/Controllers/SimulationEventController.php` |

## Implementation details

### `buildAssignmentPools(SimulationEvent $event): array`

- Reads exercise plan `personnel` roles; skips Marshal.
- Lead / Assistant Trainer → `QualifiedTrainer::active()`, available (prefer linked `User.assignment_status` when `user_id` set) **or** already on this event.
- Other roles → `User` `role=STAFF`, `status=active`, `position` exact match, same availability rule.
- No Group 3 / Group 5 pools.
- Shape: `{ role, recommended_count, members[], assigned[] }`.
- Trainer members use `source_group=group6_trainers` and `id` = `qualified_trainer_id`.

### `syncEventPersonnelAssignments(..., ?array $replaceRoles = null)`

- Accepts all roles (not marshals-only).
- **Merge by role:** incoming roles replace only those roles; other event JSON rows kept.
- `replace_roles` optional; if absent, roles inferred from incoming assignments.
- Validates LGU/trainer assignable (available or already on this event).
- Diff previous vs merged for `lgu_staff` / `group6_trainers`:
  - removed → `available`
  - added → `assigned_to_simulation`
- Preserves marshal fields `bpso_personnel_id`, `patrol_request_id`.
- Persists `qualified_trainer_id` for trainers.
- Linked trainer `user_id` kept in sync on status updates.
- Runs inside a DB transaction.

### `releaseEventPersonnelAssignments(SimulationEvent $event): void`

- Sets `lgu_staff` / `group6_trainers` rows back to `available`.
- Does **not** call CPSQC; does **not** wipe JSON.

### Controller wiring

- `SimulationEventController::complete` / `cancel` call `releaseEventPersonnelAssignments` after status update.
- Lifecycle save endpoint accepts `qualified_trainer_id` and optional `replace_roles`.

### Payload / checklist

- `buildPayload` adds `'assignment_pools' => $this->buildAssignmentPools($event)`.
- Checklist adds `personnel_roles_assigned` when plan has non-Marshal roles (required; completed when each role’s assigned count ≥ recommended).
- Existing `cpsqc_marshals_assigned` unchanged.

## Verification

### `php -l`

```text
No syntax errors detected in app/Services/SimulationEventLifecycleService.php
No syntax errors detected in app/Http/Controllers/SimulationEventLifecycleController.php
No syntax errors detected in app/Http/Controllers/SimulationEventController.php
```

### Runtime smoke (artisan bootstrap)

| Check | Result |
|-------|--------|
| Methods present | `buildAssignmentPools`, `syncEventPersonnelAssignments`, `releaseEventPersonnelAssignments` |
| Event 20 pools | 4 roles; Lead Trainer members=11 |
| Payload key | `assignment_pools` present |
| Checklist keys | includes `cpsqc_marshals_assigned` + `personnel_roles_assigned` |
| Assign STAFF Evaluator | `assignment_status` → `assigned_to_simulation` |
| Release | → `available` |
| Merge-by-role | Marshal row preserved when saving Evaluator only |

Test data restored after smoke.

## Self-review

| Check | Result |
|-------|--------|
| Merge-by-role prevents marshal wipe | Yes |
| Status flip on assign/remove/complete/cancel | Yes |
| CPSQC behavior preserved | Yes (no release API; JSON kept on release) |
| Exercise Plan / Readiness UI untouched | Yes (Task 3/4) |
| Commits | None |

## Concerns / follow-ups

- `autoCompleteExpiredEvents()` still completes without calling `releaseEventPersonnelAssignments` (brief only wired explicit complete/cancel).
- Trainer pool loads all active trainers then filters in PHP; fine for current scale.
- Full HTTP PUT smoke with session cookie not run; service-level assign/merge/release verified.

## Manual API smoke (optional)

```http
PUT /admin/simulation-events/{id}/personnel-assignments
{
  "assignments": [
    {
      "role": "Evaluator",
      "source_group": "lgu_staff",
      "person_name": "...",
      "person_external_id": "12"
    }
  ]
}
```

Expected: 200; user `assignment_status=assigned_to_simulation`; other roles on event JSON retained.

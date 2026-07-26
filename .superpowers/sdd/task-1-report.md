# Task 1 Report: Migration + model fields for `assignment_status`

**Status:** DONE  
**Branch:** `feature/readiness-personnel-assignment`  
**Date:** 2026-07-26

## Summary

Added `assignment_status` columns to `users` and `qualified_trainers` with default `available`, plus model constants, fillable entries, and `isAssignmentAvailable()` helpers on both models. Migration ran successfully locally.

## Files changed

| Action | Path |
|--------|------|
| Created | `my-app/database/migrations/2026_07_26_000001_add_assignment_status_to_users_and_qualified_trainers.php` |
| Modified | `my-app/app/Models/User.php` |
| Modified | `my-app/app/Models/QualifiedTrainer.php` |

## Migration details

**File:** `2026_07_26_000001_add_assignment_status_to_users_and_qualified_trainers.php`

- `users.assignment_status` — `string(40)`, default `'available'`, placed after `status`
- `qualified_trainers.assignment_status` — `string(40)`, default `'available'`, placed after `status`
- Both `up()` and `down()` use `Schema::hasColumn` guards for idempotent apply/rollback

## Model changes

### User

Constants:
- `ASSIGNMENT_AVAILABLE = 'available'`
- `ASSIGNMENT_ASSIGNED_TO_SIMULATION = 'assigned_to_simulation'`
- `ASSIGNMENT_UNAVAILABLE = 'unavailable'`

- Added `assignment_status` to `$fillable` (after `status`)
- Added `isAssignmentAvailable(): bool` — returns true when `assignment_status === ASSIGNMENT_AVAILABLE`

### QualifiedTrainer

Same three constants, fillable entry, and `isAssignmentAvailable()` helper (mirrors `isActive()` pattern).

## Verification

### Migration

```text
php artisan migrate --force
→ 2026_07_26_000001_add_assignment_status_to_users_and_qualified_trainers ... DONE (332ms)
```

### Column existence

```text
php artisan tinker --execute="..."
→ {"users":true,"qualified_trainers":true}
```

### Constants

```text
User: ["available","assigned_to_simulation","unavailable"]
QualifiedTrainer: ["available","assigned_to_simulation","unavailable"]
```

### Linter

No linter errors on modified model files.

## Self-review

| Check | Result |
|-------|--------|
| Status strings match spec verbatim | Yes — `available`, `assigned_to_simulation`, `unavailable` |
| Default column value | `available` on both tables |
| Scope limited to Task 1 | Yes — no service/UI/controller changes |
| Unrelated refactors | None |
| Commits | None (per user rule) |

## Production reminder (Task 1 Step 4)

After deploy to production (`/var/www/html/disaster_training_alertaraqc/my-app`):

```bash
cd /var/www/html/disaster_training_alertaraqc/my-app
php artisan migrate --force
php artisan config:clear
php artisan view:clear
```

Confirm columns exist:
- `users.assignment_status`
- `qualified_trainers.assignment_status`
- `simulation_events.event_personnel_assignments` (pre-existing; required by later tasks)

## Concerns

None. Task 1 is complete and ready for Task 2 (lifecycle service pools/sync/release).

## Commits

None — user did not request a commit.

# Task 1: Migration + model fields for `assignment_status`

**Files:**
- Create: `my-app/database/migrations/2026_07_26_000001_add_assignment_status_to_users_and_qualified_trainers.php`
- Modify: `my-app/app/Models/User.php`
- Modify: `my-app/app/Models/QualifiedTrainer.php`

**Produces:**
- `User::ASSIGNMENT_AVAILABLE`, `ASSIGNMENT_ASSIGNED_TO_SIMULATION`, `ASSIGNMENT_UNAVAILABLE`
- Column `users.assignment_status` default `available`
- Column `qualified_trainers.assignment_status` default `available`

## Step 1: Add migration

Create file with exact content from plan — `assignment_status` string(40) default `available` on `users` (after `status`) and `qualified_trainers` (after `status`), with `hasColumn` guards.

## Step 2: Update models

On `User` and `QualifiedTrainer`:
- Add constants for the three statuses: `available`, `assigned_to_simulation`, `unavailable`
- Add `assignment_status` to `$fillable`
- Add helper `isAssignmentAvailable(): bool` (true when status === available)

## Step 3: Run migration locally

```bash
cd my-app
php artisan migrate --force
```

Expected: migration runs; columns exist.

## Step 4

Note production migrate reminder in report only (do not SSH).

## Constraints for this task

- DO NOT create a git commit (user forbids commits unless explicitly requested)
- DO NOT change unrelated files
- YAGNI — only migration + model constants/fillable/helper

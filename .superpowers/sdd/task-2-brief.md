# Task 2: Lifecycle service — pools, sync, release

**Files:**
- Modify: `my-app/app/Services/SimulationEventLifecycleService.php`
- Modify: `my-app/app/Http/Controllers/SimulationEventLifecycleController.php`
- Modify: `my-app/app/Http/Controllers/SimulationEventController.php` (complete/cancel)

**Consumes:** Task 1 status fields (`User`/`QualifiedTrainer` ASSIGNMENT_* constants); existing `event_personnel_assignments`

**Produces:**
- `buildAssignmentPools(SimulationEvent $event): array`
- `syncEventPersonnelAssignments(...)` updates JSON **and** flips statuses (all roles)
- `releaseEventPersonnelAssignments(SimulationEvent $event): void`
- Payload key `assignment_pools`; CPSQC payload unchanged in behavior

## Critical merge rule

When saving assignments, **merge by role**: incoming roles replace only those roles; other roles already on the event JSON are kept. This prevents marshal-only saves from wiping LGU assignments and vice versa.

Optional request param `replace_roles: string[]` — if present, only those roles are replaced; if absent, infer roles from the incoming assignments array and merge.

## Step 1: `buildAssignmentPools`

From exercise plan personnel roles (skip Marshal):
- Lead Trainer / Assistant Trainer → QualifiedTrainer::active(), assignment available OR already assigned on this event
- Other roles → User STAFF, status active, position exact match, same availability rule
- No Group 3 / Group 5

Return list of:
```php
[
  'role' => 'Evaluator',
  'recommended_count' => 2,
  'members' => [
    ['id' => 12, 'name' => 'Ana Reyes', 'source_group' => 'lgu_staff', 'position' => 'Evaluator'],
  ],
  'assigned' => [ /* current event rows for this role */ ],
]
```
For trainers, members use `source_group` => `group6_trainers` and include `qualified_trainer_id` as `id`.

## Step 2: Expand `syncEventPersonnelAssignments`

- Accept full assignments array
- Validate assignable (available or already on this event)
- Diff previous vs new for LGU/trainer only:
  - removed → available
  - added → assigned_to_simulation
- Persist JSON (merged)
- Preserve marshal fields bpso_personnel_id, patrol_request_id
- If linked trainer has user_id, keep user assignment_status in sync when updating trainer

## Step 3: `releaseEventPersonnelAssignments`

- For lgu_staff / group6_trainers rows → set available
- No CPSQC call; do not wipe JSON

## Step 4: Wire complete + cancel in SimulationEventController

After successful complete/cancel: `$this->lifecycle->releaseEventPersonnelAssignments($simulationEvent);`

## Step 5: Expose in buildPayload

`'assignment_pools' => $this->buildAssignmentPools($event),`

Also add readiness checklist item for non-Marshal roles filled (assigned count >= recommended) when plan has those roles — key `personnel_roles_assigned`. Keep existing `cpsqc_marshals_assigned`.

## Step 6: Verify

- `php -l` on changed PHP files
- Prefer a small artisan tinker or unit-style check if easy; otherwise document manual API smoke

## Constraints

- DO NOT commit
- DO NOT change Exercise Plan React form (Task 3) or Readiness UI panels beyond payload (Task 4)
- YAGNI

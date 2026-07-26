# Readiness Personnel Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all person assignment to Simulation Readiness (roles-only Exercise Plan), add local `assignment_status` for Users/Trainers, keep CPSQC marshals as-is, remove Group 3/5 pools.

**Architecture:** Exercise Plan stores role blueprints only. Scheduled events store concrete people in `simulation_events.event_personnel_assignments` (JSON). STAFF/trainers get `assignment_status` (`available` | `assigned_to_simulation` | `unavailable`). Readiness UI assigns by role filter; complete/cancel releases LGU/trainer status. Marshal remains CPSQC request → approve → select. No Group 5 Medical API — Medical Team uses local STAFF `position`.

**Tech Stack:** Laravel (PHP), React (Inertia/Blade-mounted), MySQL/MariaDB, existing `CpsqcPatrolApiClient`, `SimulationEventLifecycleService`.

**Spec:** `docs/superpowers/specs/2026-07-26-readiness-personnel-assignment-design.md`

## Global Constraints

- Product flow must stay: Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring
- Do not revive deprecated Edit Simulation Event form for template-based events
- No CPSQC auto-return API in phase 1
- No Group 3 / Group 5 partner pools
- Commits only when the user explicitly asks
- Prefer smallest change; no drive-by refactors

## File map

| File | Responsibility |
|---|---|
| `my-app/database/migrations/2026_07_26_*_add_assignment_status_*.php` | Add `assignment_status` to `users` and `qualified_trainers` |
| `my-app/app/Models/User.php` | Constants + fillable/casts helpers for assignment status |
| `my-app/app/Models/QualifiedTrainer.php` | Same |
| `my-app/app/Services/SimulationEventLifecycleService.php` | Pools, sync assignments + status, release on complete/cancel, roster |
| `my-app/app/Http/Controllers/SimulationEventLifecycleController.php` | Expand save endpoint; expose pools in payload |
| `my-app/app/Http/Controllers/SimulationEventController.php` | Call release on complete/cancel |
| `my-app/resources/js/components/SimulationEventLifecyclePage.jsx` | Per-role assign UI on Readiness |
| `my-app/resources/js/pages/SimulationExerciseTemplateForm.jsx` | Roles-only; remove person assign UI |
| `my-app/app/Services/SimulationExerciseTemplateService.php` | Personnel pool without Group3/5/CPSQC assign |
| Users & Roles admin UI (existing admin users page/component) | Show/edit `assignment_status` |

---

### Task 1: Migration + model fields for `assignment_status`

**Files:**
- Create: `my-app/database/migrations/2026_07_26_000001_add_assignment_status_to_users_and_qualified_trainers.php`
- Modify: `my-app/app/Models/User.php`
- Modify: `my-app/app/Models/QualifiedTrainer.php`

**Produces:**
- `User::ASSIGNMENT_AVAILABLE`, `ASSIGNMENT_ASSIGNED_TO_SIMULATION`, `ASSIGNMENT_UNAVAILABLE`
- Column `users.assignment_status` default `available`
- Column `qualified_trainers.assignment_status` default `available`

- [ ] **Step 1: Add migration**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'assignment_status')) {
                $table->string('assignment_status', 40)->default('available')->after('status');
            }
        });

        Schema::table('qualified_trainers', function (Blueprint $table) {
            if (! Schema::hasColumn('qualified_trainers', 'assignment_status')) {
                $table->string('assignment_status', 40)->default('available')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'assignment_status')) {
                $table->dropColumn('assignment_status');
            }
        });
        Schema::table('qualified_trainers', function (Blueprint $table) {
            if (Schema::hasColumn('qualified_trainers', 'assignment_status')) {
                $table->dropColumn('assignment_status');
            }
        });
    }
};
```

- [ ] **Step 2: Update models**

On `User` and `QualifiedTrainer`:
- Add constants for the three statuses
- Add `assignment_status` to `$fillable`
- Add helper `isAssignmentAvailable(): bool`

- [ ] **Step 3: Run migration locally**

```bash
cd my-app
php artisan migrate --force
```

Expected: migration runs; columns exist.

- [ ] **Step 4: Verify production reminder**

After deploy: same migrate on production (also confirm `event_personnel_assignments` exists — already required).

---

### Task 2: Lifecycle service — pools, sync, release

**Files:**
- Modify: `my-app/app/Services/SimulationEventLifecycleService.php`
- Modify: `my-app/app/Http/Controllers/SimulationEventLifecycleController.php`
- Modify: `my-app/app/Http/Controllers/SimulationEventController.php` (complete/cancel)

**Consumes:** Task 1 status fields; existing `event_personnel_assignments`

**Produces:**
- `buildAssignmentPools(SimulationEvent $event): array` keyed by role
- `syncEventPersonnelAssignments(...)` updates JSON **and** flips statuses (all roles, not marshals-only)
- `releaseEventPersonnelAssignments(SimulationEvent $event): void` sets LGU/trainer back to `available`
- Payload key `assignment_pools` + expanded `cpsqc` unchanged

- [ ] **Step 1: Implement pool builders**

Rules:
- Lead Trainer / Assistant Trainer → `QualifiedTrainer::active()` where `assignment_status = available` OR already on this event
- Other non-Marshal roles → `User` role `STAFF`, `status = active`, `position` exact match to exercise role, same availability rule
- Marshal → not in these pools (CPSQC panel only)
- No Group 3 / Group 5 entries

Return shape per role:

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

- [ ] **Step 2: Expand `syncEventPersonnelAssignments`**

- Accept full `assignments` array (all roles)
- Validate each person still assignable (or already on this event)
- Diff previous vs new:
  - removed LGU/trainer → set `available`
  - newly added → set `assigned_to_simulation`
- Persist JSON on event
- Preserve marshal fields (`bpso_personnel_id`, `patrol_request_id`) when present

- [ ] **Step 3: Implement `releaseEventPersonnelAssignments`**

- Load event JSON
- For each row with `source_group` in `lgu_staff` / `group6_trainers`, set matching user/trainer to `available`
- Do **not** call CPSQC
- Do **not** wipe JSON (keep history)

- [ ] **Step 4: Wire complete + cancel**

In `SimulationEventController` (or wherever complete/cancel already update status), after successful complete/cancel call:

```php
$this->lifecycle->releaseEventPersonnelAssignments($simulationEvent);
```

- [ ] **Step 5: Expose pools in `buildPayload`**

```php
'assignment_pools' => $this->buildAssignmentPools($event),
```

- [ ] **Step 6: Manual API smoke**

```bash
# After login session / with app running
# PUT /admin/simulation-events/{id}/personnel-assignments
# body: { "assignments": [ { "role":"Evaluator", "source_group":"lgu_staff", "person_name":"...", "person_external_id":"12" } ] }
```

Expected: 200; user `assignment_status` = `assigned_to_simulation`; roster shows Assigned.

---

### Task 3: Exercise Plan — roles only (remove assign UI + Group 3/5)

**Files:**
- Modify: `my-app/resources/js/pages/SimulationExerciseTemplateForm.jsx`
- Modify: `my-app/app/Services/SimulationExerciseTemplateService.php` (`buildPersonnelPool`)

- [ ] **Step 1: Strip person assignment UI**

In Recommended Personnel section:
- Keep role / recommended_count / notes
- Remove “Assign Personnel” blocks (person `<select>`, add/remove assignment)
- Remove saving of `personnel_assignments` from client payload **or** always send `[]` / omit and stop syncing people on template update (prefer: stop accepting meaningful assignments — sync empty / ignore person fields)
- Update copy: assign at Simulation Readiness; Medical Team = local staff later, not Group 5

- [ ] **Step 2: Slim `buildPersonnelPool`**

Keep trainers + LGU staff only if still needed for any leftover UI; otherwise return empty pools or remove pool panel entirely. **Remove** `group3_personnel` and `group5_medical` entries.

- [ ] **Step 3: Backend template update**

In `SimulationExerciseTemplateService::syncPersonnelAssignments` path used by store/update: either no-op person rows or clear assignments so templates stay role-only going forward.

- [ ] **Step 4: UI check**

Open Exercise Plan edit → Recommended Personnel shows roles/counts only; no person dropdowns; no Group 3/5 lines.

---

### Task 4: Readiness UI — per-role assign + keep CPSQC marshals

**Files:**
- Modify: `my-app/resources/js/components/SimulationEventLifecyclePage.jsx`

- [ ] **Step 1: Add `RoleAssignmentPanel`**

For each entry in `lifecycle.assignment_pools` where `role !== 'Marshal'`:
- Show role + recommended_count
- N selectors (or multi-select) limited to recommended_count
- Options from `members` (name — position)
- Prefill from `assigned`

- [ ] **Step 2: Save all non-marshal + marshal together**

On “Save Personnel Assignments”:
- Build assignments array from role panels + current CPSQC marshal selections (or save role panel separately from marshal panel but merge server-side)
- `PUT /admin/simulation-events/{id}/personnel-assignments`

Prefer **one save** for LGU/trainer roles; keep existing marshal “Save Marshal Assignments” but ensure marshal save **merges** (does not wipe other roles). Update `syncEventPersonnelAssignments` to merge by role:

```text
incoming roles replace those roles only; other roles on event JSON kept
```

- [ ] **Step 3: Keep `CpsqcMarshalPanel`**

No change to CPSQC request/refresh flow except merge-safe save.

- [ ] **Step 4: Checklist**

- Keep `cpsqc_marshals_assigned` when plan has Marshal
- Add `personnel_roles_assigned` (or extend): for each non-Marshal role on plan, assigned count >= recommended_count → completed; required true

- [ ] **Step 5: Manual UI test**

1. Event from exercise plan with Evaluator + Marshal roles  
2. Readiness: assign Evaluator from STAFF list  
3. Request/approve CPSQC; assign marshals  
4. Checklist goes green when counts met  
5. Complete event → STAFF/trainer status back to available  

---

### Task 5: Users & Roles — show/edit `assignment_status`

**Files:**
- Modify: admin Users & Roles UI (locate via Grep `assignment` / staff user form — likely under `resources/js` admin users components + `AdminUserController`)

- [ ] **Step 1: Find staff edit form**

```bash
rg -n "position|STAFF|qualified" my-app/resources/js my-app/app/Http/Controllers/AdminUserController.php
```

- [ ] **Step 2: Add select for assignment_status**

Options: Available / Assigned to Simulation (read-only or disabled in manual edit) / Unavailable  
Manual edit allowed: `available` ↔ `unavailable` only.

- [ ] **Step 3: Persist via existing user update endpoint**

Validate `assignment_status` in `in:available,unavailable` for manual updates (block setting `assigned_to_simulation` from admin form).

- [ ] **Step 4: Verify**

Mark a staff Unavailable → they disappear from Readiness pool.

---

### Task 6: Production deploy checklist

- [ ] **Step 1: Deploy code** (git pull / release) to `/var/www/html/disaster_training_alertaraqc/my-app`
- [ ] **Step 2: Migrate**

```bash
cd /var/www/html/disaster_training_alertaraqc/my-app
php artisan migrate --force
php artisan config:clear
php artisan view:clear
```

Confirm columns:
- `simulation_events.event_personnel_assignments`
- `users.assignment_status`
- `qualified_trainers.assignment_status`

- [ ] **Step 3: Rebuild assets if needed**

```bash
npm run build
```

- [ ] **Step 4: Smoke on production event**

Save personnel on Readiness without `Column not found` errors.

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Exercise Plan roles-only | 3 |
| Remove Group 3/5 | 3 |
| Medical = local STAFF not Group 5 | 2, 3, 4 |
| Readiness assign trainers | 2, 4 |
| Readiness assign STAFF by position | 2, 4 |
| Marshal CPSQC unchanged (no auto-return) | 4 |
| `assignment_status` 3 values | 1, 5 |
| Assign → assigned_to_simulation | 2 |
| Complete/cancel → available | 2 |
| Users & Roles manual unavailable | 5 |
| Production migrate | 6 |

## Placeholder / consistency scan

- Status values consistently: `available`, `assigned_to_simulation`, `unavailable`
- Merge-by-role on save so marshal and LGU saves do not wipe each other
- No CPSQC release endpoint invented

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-07-26-readiness-personnel-assignment.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — implement in this session with checkpoints  

Which approach?

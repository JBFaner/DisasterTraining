# Task 4: Readiness UI — per-role assign + keep CPSQC marshals

**File:** `my-app/resources/js/components/SimulationEventLifecyclePage.jsx`

Backend already provides:
- `lifecycle.assignment_pools` — list of `{ role, recommended_count, members[], assigned[] }`
- `lifecycle.cpsqc` — existing marshal panel data
- `PUT /admin/simulation-events/{id}/personnel-assignments` with merge-by-role
- Checklist keys: `personnel_roles_assigned`, `cpsqc_marshals_assigned`

## Step 1: RoleAssignmentPanel

For each `assignment_pools` entry (skip if role === Marshal — shouldn't be in pools):
- Show role label + recommended_count
- Up to N selectors (N = recommended_count)
- Options from `members`: display `name — position` (or specialization)
- Prefill from `assigned` (person_external_id or qualified_trainer_id / id)
- Prevent selecting the same person twice across slots for that role

## Step 2: Save LGU/trainer assignments

Button “Save Personnel Assignments”:
- Build assignments from selected slots:
  - trainers: `source_group: group6_trainers`, `qualified_trainer_id`, `person_name`
  - staff: `source_group: lgu_staff`, `person_external_id`, `person_name`
- PUT with `{ assignments: [...] }` (server merges; does not wipe marshals)
- On success: `onLifecycleUpdate` / setLifecycle from response

## Step 3: Keep CpsqcMarshalPanel

Ensure marshal save still sends only Marshal rows (merge-safe). Do not remove CPSQC request/refresh.

## Step 4: UI placement

In Readiness tab, above or below roster:
1. Role assignment panel (all non-marshal pools)
2. Existing personnel roster table (read-only summary OK)
3. Existing CPSQC panel

Update copy: assign LGU/trainer roles here; marshals via CPSQC.

## Constraints

- DO NOT commit
- Match existing AdminPrimaryButton / AdminSecondaryButton / Swal patterns in the file
- YAGNI — no redesign of other tabs

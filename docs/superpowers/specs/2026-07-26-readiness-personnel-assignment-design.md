# Readiness Personnel Assignment (Phase 1)

**Date:** 2026-07-26  
**Status:** Approved for planning  
**Product flow:** `Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring`

## Problem

Exercise Plans are reusable templates. Assigning specific people (especially CPSQC marshals) on the template causes stale assignments when the plan is reused for a new schedule. Personnel assignment belongs on the scheduled **simulation event**, at **Readiness**.

## Desired outcome

- Exercise Plan defines **roles + recommended counts only**.
- Simulation Readiness is where people are assigned to those roles.
- LGU staff/trainers have a local **assignment status** so they are not double-booked.
- When a simulation completes or is cancelled, assigned LGU/trainer people return to **Available**.
- CPSQC marshals stay on the existing request → approve → assign flow (no auto-return API until CPSQC provides one).
- Remove unused Group 3 / Group 5 “integration pending” personnel pools from the Exercise Plan UI.
- **Medical Team** (if listed on the plan) is assigned from local Users & Roles STAFF (`position = Medical Team`) — **not** from Group 5 partner API (none).

## Decisions (locked)

| Topic | Choice |
|---|---|
| Status ownership (phase 1) | Local Disaster Training only; no CPSQC release API |
| Where to assign | Readiness (all LGU roles); Marshal via CPSQC |
| Status set | `available` \| `assigned_to_simulation` \| `unavailable` |
| Trainer source | Qualified Trainers |
| Support role source | STAFF users filtered by `position` |
| Approach | Event-level `event_personnel_assignments` JSON + `assignment_status` on users/trainers |

## Out of scope (phase 1)

- CPSQC auto-return to Available after simulation
- Full status set: generic Assigned, On Patrol
- Group 3 Resource Allocation integration
- Group 5 Medical partner API (no connection). Medical Team role uses local STAFF only.
- Changing CPSQC `source_group` whitelist

---

## Flow

```text
Exercise Plan
  → roles + recommended_count (+ notes) only
  → no person pickers
  → Marshal = count only

Use Template (event date / venue / schedule)
  → Simulation Readiness
       → assign Lead / Assistant from Qualified Trainers (available)
       → assign other roles from STAFF by position (available)
       → Marshal: CPSQC request → approve → select → save
       → on save: assignment_status = assigned_to_simulation
  → Publish / Start
  → Complete / Cancel
       → release LGU/trainer rows → available
       → CPSQC: no remote status update (phase 1)
```

---

## Data model

### `users.assignment_status` (STAFF)

- Values: `available` | `assigned_to_simulation` | `unavailable`
- Default: `available`
- Orthogonal to account `status` (`active` / `inactive`)

### `qualified_trainers.assignment_status`

- Same values/default
- If trainer has `user_id`, prefer the linked user’s `assignment_status` when checking availability (keep trainer field in sync on assign/release for simplicity)

### `simulation_events.event_personnel_assignments` (JSON, already added)

Example:

```json
[
  {
    "role": "Evaluator",
    "source_group": "lgu_staff",
    "person_name": "Ana Reyes",
    "person_external_id": "12",
    "qualified_trainer_id": null,
    "notes": null
  },
  {
    "role": "Lead Trainer",
    "source_group": "group6_trainers",
    "person_name": "Reymon",
    "qualified_trainer_id": 3,
    "person_external_id": null
  },
  {
    "role": "Marshal",
    "source_group": "cpsqc_patrol",
    "person_name": "Maeren Marto",
    "person_external_id": "4",
    "bpso_personnel_id": "PER-01",
    "patrol_request_id": "PT-REQ-2026-002"
  }
]
```

### Position ↔ role mapping (STAFF)

| Exercise role | `users.position` match |
|---|---|
| Safety Officer | Safety Officer |
| Medical Team | Medical Team |
| Evaluator | Evaluator |
| Communication Officer | Communication Officer |
| Attendance Officer | Attendance Officer |
| Lead / Assistant Trainer | N/A — Qualified Trainers pool |
| Marshal | N/A — CPSQC only |

Exact match on `position` string (same labels as `SimulationExerciseTemplate::PERSONNEL_ROLES` where applicable).

---

## UI

### Exercise Plan (`SimulationExerciseTemplateForm`)

- Keep Recommended Personnel roles + counts + notes.
- Remove Assign Personnel person pickers / pool assignment UI.
- Remove Group 3 / Group 5 pending pool display (or replace with short note that event staffing is at Readiness).
- Copy: “Assign people in Simulation Readiness after the event is scheduled.”

### Readiness (`SimulationEventLifecyclePage`)

- Personnel roster from exercise plan roles + `event_personnel_assignments`.
- Per role (except Marshal): selectors for up to `recommended_count`, options filtered as above.
- Marshal: existing CPSQC Patrol Marshals panel.
- Save endpoint updates JSON and flips `assignment_status`.
- Checklist:
  - Keep `cpsqc_marshals_assigned` when plan has Marshal role.
  - Add or generalize coverage check for other required roles (recommended: all recommended slots filled before start, or soft warning — default **required for roles listed on the plan**).

### Users & Roles

- Show `assignment_status` with ability to set `unavailable` / `available` manually (block manual set to `assigned_to_simulation` except via Readiness).
- Account inactive users never appear in Readiness pools.

---

## Lifecycle rules

**On assign (Readiness save):**

1. Validate person is still `available` (and account/trainer active).
2. Write/replace assignments for that event (merge by role: non-touched roles preserved).
3. Set assigned people to `assigned_to_simulation`.
4. People removed from the event assignment list → set back to `available` if they were assigned to this event.

**On event complete / cancel:**

1. For each LGU/trainer assignment on the event → `available`.
2. Leave JSON history on the event (do not wipe) unless product later prefers clear-on-cancel.
3. Do not call CPSQC.

**Double-book prevention:**

- Pool queries: `assignment_status = available` only (plus already selected on this event so editors can keep current picks).

---

## API / backend touchpoints

| Area | Change |
|---|---|
| Migration | `users.assignment_status`, `qualified_trainers.assignment_status` |
| Lifecycle payload | Role pools + current assignments for Readiness UI |
| `PUT .../personnel-assignments` | Expand beyond marshals; sync status |
| Complete / cancel event | Release assignment statuses |
| Exercise Plan form/service | Strip assign UI; stop exposing CPSQC/Group3/5 as assign pools |
| Users & Roles admin UI | Display/edit assignment status |

CPSQC client/routes remain event-scoped (`simulation-event:{id}`).

---

## Acceptance criteria

- [ ] Exercise Plan has no person-assignment UI; roles/counts only
- [ ] Group 3 / Group 5 removed from plan personnel pool UI
- [ ] Readiness assigns Lead/Assistant from Qualified Trainers (available only)
- [ ] Readiness assigns other LGU roles from STAFF by position (available only)
- [ ] Marshal still via CPSQC request → approve → select → save
- [ ] Save sets `assignment_status = assigned_to_simulation`
- [ ] Complete/cancel releases LGU/trainers to `available`
- [ ] Users & Roles can mark `unavailable`
- [ ] No CPSQC auto-return in phase 1
- [ ] Production migrations applied before relying on save

## Production note

`event_personnel_assignments` column must exist on production (`php artisan migrate`). Same for new `assignment_status` columns when this ships.

## Future (phase 2+)

- CPSQC release/return Available API when partner ships it
- Optional statuses: Assigned, On Patrol
- Stronger audit log of who was assigned when

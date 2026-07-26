# Task 3 Report: Exercise Plan — roles only

**Status:** DONE  
**Branch:** `feature/readiness-personnel-assignment`  
**Date:** 2026-07-26  
**Commits:** none

## Summary

Exercise Plan Recommended Personnel is role/count/notes only. Person assign UI, pool availability panel, and Group 3/5 entries are gone. Saves send `personnel_assignments: []`; backend clears template person rows on store/update.

## Files changed

| Action | Path |
|--------|------|
| Modified | `my-app/resources/js/pages/SimulationExerciseTemplateForm.jsx` |
| Modified | `my-app/app/Services/SimulationExerciseTemplateService.php` |

## Implementation details

### Frontend (`SimulationExerciseTemplateForm.jsx`)

- Removed Assign Personnel blocks (person `<select>`, add/remove assignment).
- Removed pool availability panel and all person-ref / assignment helpers/state.
- Persist + AI context always send `personnel_assignments: []`.
- Copy points assign to Simulation Readiness; Medical Team = local LGU staff, not Group 5.
- Kept role / recommended_count / notes + Marshal tip.

### Backend (`SimulationExerciseTemplateService.php`)

- `buildPersonnelPool()` returns `[]` (no Group 3/5; no unused trainer/staff queries for template form).
- `syncPersonnelAssignments()` deletes all template person assignment rows (ignores incoming person fields).
- `serializePersonnelAssignments()` returns stored rows only (no legacy synth from `personnel.qualified_trainer_id`).

## Verification

### Structure / grep

- No `Assign Personnel`, person-assign selects, `group3_personnel`, or `group5_medical` in template form.
- Recommended Personnel still has Role / Recommended Count / Notes.
- RoleSelect `<select>` remains (role picker, not person).

### `php -l`

```text
No syntax errors detected in app/Services/SimulationExerciseTemplateService.php
```

### Manual UI

Not opened in browser this run; structure check confirms no person dropdowns in Recommended Personnel.

## Concerns

- Existing templates keep assignment rows until next save (then cleared).
- Legacy `personnel.qualified_trainer_id` columns may still exist on old rows but are no longer serialized into form props.
- Readiness assign UI is Task 4 — not touched.
- Unused `$assignments` param kept on `syncPersonnelAssignments` for call-site compatibility.

## Acceptance

- [x] Roles/counts/notes only in Recommended Personnel
- [x] No person dropdowns / Assign Personnel UI
- [x] No Group 3/5 pool lines
- [x] Template save does not persist people
- [x] No commit

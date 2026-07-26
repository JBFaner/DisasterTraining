# Task 3: Exercise Plan — roles only (remove assign UI + Group 3/5)

**Files:**
- Modify: `my-app/resources/js/pages/SimulationExerciseTemplateForm.jsx`
- Modify: `my-app/app/Services/SimulationExerciseTemplateService.php` (`buildPersonnelPool` and sync assignments)

## Step 1: Strip person assignment UI

In Recommended Personnel:
- Keep role / recommended_count / notes
- Remove “Assign Personnel” blocks (person select, add/remove assignment)
- Stop sending meaningful `personnel_assignments` (send `[]` or omit; backend ignores person assign)
- Copy: assign people in Simulation Readiness after schedule exists; Medical Team = local staff later, not Group 5

## Step 2: Slim `buildPersonnelPool`

Remove `group3_personnel` and `group5_medical`. Can keep trainers/staff pools only if still shown; prefer removing the pool availability panel if assign UI is gone, or show a short note only.

## Step 3: Backend

`syncPersonnelAssignments` on template store/update: clear assignments or no-op person rows so templates stay role-only.

## Step 4

Verify file structure: no person dropdowns remain in Recommended Personnel.

## Constraints

- DO NOT commit
- DO NOT change Readiness lifecycle page (Task 4)
- YAGNI

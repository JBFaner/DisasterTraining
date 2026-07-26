# Task 5 Report: Users & Roles `assignment_status` UI

**Status:** DONE  
**Branch:** `feature/readiness-personnel-assignment`  
**Date:** 2026-07-26  
**Commits:** none

## Summary

Admin Users & Roles now shows `assignment_status` on the list and detail pages. Edit form allows manual `available` ↔ `unavailable` only; `assigned_to_simulation` is read-only with a “Managed by Simulation Readiness” note. `AdminUserController@update` validates accordingly and mirrors status onto linked Qualified Trainers.

## Files changed

| Action | Path |
|--------|------|
| Modified | `my-app/app/Http/Controllers/AdminUserController.php` |
| Modified | `my-app/app/Services/StaffTrainerBridgeService.php` |
| Modified | `my-app/resources/js/pages/AdminUsersPage.jsx` |
| Modified | `my-app/resources/js/pages/UserDetailsPage.jsx` |
| Modified | `my-app/resources/js/app.jsx` |

## Implementation details

### List (`AdminUsersPage`)

- Added **Assignment** column with badges: Available / Unavailable / Assigned to Simulation.

### Detail (`UserDetailsPage`)

- Added **Assignment Status** field; note when status is `assigned_to_simulation`.

### Edit form (`app.jsx` `admin_users_edit`)

- Select: Available / Unavailable when editable.
- If currently `assigned_to_simulation`: disabled read-only display + note (no `name` submitted).

### Backend (`AdminUserController@update`)

- When not simulation-managed: `assignment_status` required `in:available,unavailable`.
- When `assigned_to_simulation`: field ignored; status unchanged.
- Audit log includes `assignment_status`.

### Trainer mirror

- `StaffTrainerBridgeService::ensureMirror` copies `assignment_status` so trainer pools stay in sync for LGU_TRAINER users.

## Verification

### Structure / grep

- `assignment_status` validation + persist in `AdminUserController`.
- List/detail/edit UI labels and Managed-by-Simulation copy present.
- PHP lint clean on controller + bridge service.

### Manual UI

Not opened in browser this run; wiring matches existing admin form patterns and Blade `@json($users)`.

## Concerns

- Create user form still relies on DB default `available` (no create-time picker) — intentional YAGNI.
- Qualified Trainers admin detail UI not updated separately; trainer-linked users sync via bridge on user update.
- UI not browser-tested; assets may need `npm run build` / Vite for production.

## Acceptance

- [x] Show `assignment_status` on list + detail
- [x] Edit: available ↔ unavailable only
- [x] `assigned_to_simulation` read-only / Managed by Simulation Readiness
- [x] Update validation blocks manual `assigned_to_simulation`
- [x] No commit

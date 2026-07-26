# Task 5: Users & Roles — show/edit `assignment_status`

**Likely files:**
- `my-app/app/Http/Controllers/AdminUserController.php` (store/update validation)
- `my-app/resources/js/pages/AdminUsersPage.jsx` (table column optional)
- `my-app/resources/js/pages/UserDetailsPage.jsx` and/or create/edit user forms (find via Grep `position` / account_type)
- Possibly Blade-fed props for create/edit — search `UserCreate` / `UserEdit` / `AdminUser`

## Requirements

1. Show `assignment_status` on staff-relevant user UI (list and/or detail/edit)
2. Manual edit allowed: `available` ↔ `unavailable` only
3. Do **not** allow setting `assigned_to_simulation` from admin form (read-only display if currently that value)
4. Validate on update: `assignment_status` in `available,unavailable` for manual updates
5. If value is `assigned_to_simulation`, show label “Assigned to Simulation” and disable changing to other values except allow reset to `available` with a warning OR keep disabled until released by event — prefer: allow switch only to `unavailable`/`available` from form; if currently assigned_to_simulation, show as disabled read-only with note “Managed by Simulation Readiness”

Also check Qualified Trainers admin UI if easy — add same field; otherwise Users only is enough for Task 5.

## Constraints

- DO NOT commit
- YAGNI
- Match existing admin form patterns

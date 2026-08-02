# Patrol On Reporting after simulation complete

## Goal
After Disaster Training marks a simulation complete, assigned patrol officers must stay busy until each submits their own patrol report.

## Flow
1. `start_simulation` → status **On Patrol**
2. `complete_simulation` → status **On Reporting** (per assigned officer); request + linked schedules completed
3. That officer `submit_report` → leave On Reporting → resolve to **Available** (or Assigned if other live work)
4. Other officers remain **On Reporting** until they submit

## Status model
Add **On Reporting** to patrol availability statuses. Preserve it in `resolvePatrolAvailabilityStatus` (same idea as On Patrol — do not overwrite via schedule cleanup).

## Touch points (Community Policing / CPSQC)
- `includes/patrol_availability.php` — status list, normalize, resolve, CSS class
- `api/patrol_requests_lifecycle.php` — complete → On Reporting + notification copy
- `api/patrol_logs.php` — on successful submit, clear On Reporting then refresh
- `patrol-list.php` / `users.php` — badge CSS + JS label map

## Out of scope
- Soft timeout / auto-Available if report never submitted
- Changing Disaster Training UI beyond existing lifecycle notify

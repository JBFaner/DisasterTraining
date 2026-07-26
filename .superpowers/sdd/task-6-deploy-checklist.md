# Task 6: Production deploy checklist

**App path on server:** `/var/www/html/disaster_training_alertaraqc/my-app`

## Before deploy

- [ ] Code on branch `feature/readiness-personnel-assignment` reviewed / merged as you prefer
- [ ] Local smoke: Exercise Plan roles-only; Readiness assign LGU + CPSQC; complete releases status

## Deploy steps (SSH as root)

```bash
cd /var/www/html/disaster_training_alertaraqc/my-app
# pull / copy release with this feature
git status
php artisan migrate --force
php artisan config:clear
php artisan view:clear
php artisan route:clear
npm run build   # if frontend assets not built in CI
```

## Confirm columns exist

```bash
php artisan tinker --execute="echo Schema::hasColumn('simulation_events','event_personnel_assignments')?'epa=1':'epa=0'; echo PHP_EOL; echo Schema::hasColumn('users','assignment_status')?'user=1':'user=0'; echo PHP_EOL; echo Schema::hasColumn('qualified_trainers','assignment_status')?'qt=1':'qt=0';"
```

Expected: `epa=1`, `user=1`, `qt=1`

## Smoke on production

1. Open a simulation event → Readiness
2. Assign an Evaluator (STAFF) → Save Personnel → checklist updates
3. CPSQC marshals request/refresh/save still works
4. Mark staff Unavailable in Users & Roles → they disappear from pool
5. Complete event → staff `assignment_status` returns to `available`

## Known ops notes

- CPSQC still needs `PATROL_REQUEST_API_KEY` on their side (already working if requests exist)
- No CPSQC auto-return API in phase 1
- If `event_personnel_assignments` missing → same SQLSTATE 42S22 as before; migrate fixes it

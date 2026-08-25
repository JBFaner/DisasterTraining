# ERD Entity to Database Table Mapping

| ERD Entity | Laravel / MySQL Table |
|------------|----------------------|
| `TRAINING_MODULE` | `training_modules` |
| `SCENARIO_EXERCISE` | `scenarios` |
| `SIMULATION_EVENT` | `simulation_events` |
| `PARTICIPANT` | `users (participant role)` |
| `PARTICIPANT_REGISTRATION` | `event_registrations` |
| `EVALUATION` | `participant_evaluations` |
| `CERTIFICATION` | `certificates` |
| `RESOURCE_INVENTORY` | `resources (+ event_resource)` |
| `PATROL_SCHEDULE` | `simulation_exercise_timeline_items / personnel_assignments` |
| `CAMPAIGN` | `campaign_requests (+ simulation_plans)` |
| `SEMINAR_EVENT` | `training_contents / lesson sessions` |

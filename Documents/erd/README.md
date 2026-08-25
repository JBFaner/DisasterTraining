# ERD — Entity-Relationship Diagram (Thesis Format)

Crow's Foot ERD matching the **capstone thesis format**:
- Dark gray entity header (uppercase table name)
- **PK / FK1 / FK2** column + attribute column
- Primary keys **underlined**
- Dashed relationship lines with crow's foot notation

| File | Description |
|------|-------------|
| `37_ERD_Overall.png` | **Thesis-ready image** — insert in Word |
| `37_ERD_Overall.svg` | Vector source |
| `37_ERD_Overall.drawio` | Editable in [diagrams.net](https://app.diagrams.net) |
| `ERD_Table_Mapping.md` | ERD entity names → actual Laravel/MySQL tables |
| `generate_erd.php` | Regenerate script |

**Thesis copy:** `my-app/docs/ERD_Overall.png`

## Entities (11)

| ERD Entity | Actual Table |
|------------|--------------|
| TRAINING_MODULE | `training_modules` |
| SCENARIO_EXERCISE | `scenarios` |
| SIMULATION_EVENT | `simulation_events` |
| PARTICIPANT | `users` (participant role) |
| PARTICIPANT_REGISTRATION | `event_registrations` |
| EVALUATION | `participant_evaluations` |
| CERTIFICATION | `certificates` |
| RESOURCE_INVENTORY | `resources` (+ `event_resource`) |
| PATROL_SCHEDULE | `simulation_exercise_timeline_items` |
| CAMPAIGN | `campaign_requests` |
| SEMINAR_EVENT | `training_contents` / lesson sessions |

## Regenerate

```bash
php Documents/erd/generate_erd.php
```

## Suggested caption

*Figure X. Entity-Relationship Diagram of the Disaster Preparedness Training and Simulation System using Crow's Foot notation, showing primary keys (PK), foreign keys (FK), and relationships among training modules, simulation events, participant registration, evaluation, and certification entities.*

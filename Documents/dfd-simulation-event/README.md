# DFD — Simulation Event Planning (Level 0 · 1 · 2)

**Scope:** Sidebar module **Simulation Event Planning** (exercise plans, template → event, readiness, publish, monitoring).  
**External (not this module):** Campaign Planning (Group 6), CPSQC Patrol, Resource Inventory (linked stores only).  
**Product flow:** Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `12_DFD_Simulation_Event_L0.drawio` |
| 2 | `12_DFD_Simulation_Event_L1.drawio` |
| 3 | `12_DFD_Simulation_Event_L2.drawio` |

**All-in-one (3 tabs):** `12_DFD_Simulation_Event_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Simulation Event Planning

| External | Flows |
|----------|--------|
| Lead Trainer / Admin | Plan, template use, publish, monitor |
| Participant | View published event / schedule |
| Campaign Planning (Group 6) | Approved campaign → linked event |
| CPSQC Patrol | Personnel pool + start/complete notify |
| Resource & Equipment Inventory | Availability for planned equipment |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Manage Exercise Plan | Templates: activities, timeline, eval objectives |
| **2.0** Create Event from Template | `reuseTemplate` + approved campaign link |
| **3.0** Assign Personnel & Equipment | Roster + resource assignments |
| **4.0** Validate Readiness & Publish | Checklist gate → published |
| **5.0** Monitor Lifecycle & Execution | Steps, timeline, CPSQC notify |

| Store | Contents |
|-------|----------|
| **D1** | Exercise plans (templates) |
| **D2** | Simulation events |
| **D3** | Personnel & resource assignments |
| **D4** | Readiness checklist & publish state |
| **D5** | Timeline & execution progress |

---

## Level 2 — Process 4.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **4.1** Build Readiness Checklist | `SimulationEventLifecycleService::buildReadinessChecklist` |
| **4.2** Verify Personnel & Equipment | Assignment pools + inventory flags |
| **4.3** Gate Ready-to-Publish / Start | `isReadyToStart` |
| **4.4** Publish Event & Notify | Publish status + init execution progress |

---

## Captions

- **Figure __.** DFD Level 0 — Simulation Event Planning  
- **Figure __.** DFD Level 1 — Simulation Event Planning  
- **Figure __.** DFD Level 2 — Validate Readiness & Publish (Process 4.0)

---

## Regenerate

```bash
php Documents/dfd-simulation-event/generate_simulation_event_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ **Simulation Event Planning** (this folder)  
4. ✅ Participant Registration & Attendance → `Documents/dfd-participant-attendance/`  
5. → Resource & Equipment Inventory (next)

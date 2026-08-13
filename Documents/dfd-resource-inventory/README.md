# DFD — Resource & Equipment Inventory (Level 0 · 1 · 2)

**Scope:** Sidebar module **Resource & Equipment Inventory** (physical stock for simulation events).  
**Not this module:** Lesson learning resources (Training Module).

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `14_DFD_Resource_Inventory_L0.drawio` |
| 2 | `14_DFD_Resource_Inventory_L1.drawio` |
| 3 | `14_DFD_Resource_Inventory_L2.drawio` |

**All-in-one (3 tabs):** `14_DFD_Resource_Inventory_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Resource & Equipment Inventory

| External | Flows |
|----------|--------|
| Lead Trainer / Admin | CRUD, assign, damage, maintenance |
| Simulation Event Planning | Equipment requests + availability for readiness |
| Budget Approver | Approve/reject inventory budget proposals |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Manage Equipment Catalog | Create/update/export resources |
| **2.0** Assign Equipment to Event | Event assignment + equipment requests |
| **3.0** Track Usage & Condition | In-use, unused, report damage |
| **4.0** Return from Event | Close assignment, restock |
| **5.0** Maintenance & Budget Request | Maintenance logs + budget proposals |

| Store | Contents |
|-------|----------|
| **D1** | Equipment catalog (`Resource`) |
| **D2** | Event assignments & equipment requests |
| **D3** | Resource movements (history) |
| **D4** | Maintenance logs |
| **D5** | Budget proposals |

---

## Level 2 — Process 2.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **2.1** Validate Stock Availability | Catalog qty / condition checks |
| **2.2** Create / Approve Equipment Request | `EventEquipmentRequestController` |
| **2.3** Create Event Assignment | `ResourceController::assignToEvent` |
| **2.4** Log Movement & Update Status | `ResourceMovement` + status flags |

---

## Captions

- **Figure __.** DFD Level 0 — Resource & Equipment Inventory  
- **Figure __.** DFD Level 1 — Resource & Equipment Inventory  
- **Figure __.** DFD Level 2 — Assign Equipment to Event (Process 2.0)

---

## Regenerate

```bash
php Documents/dfd-resource-inventory/generate_resource_inventory_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ Simulation Event Planning  
4. ✅ Participant Registration & Attendance  
5. ✅ **Resource & Equipment Inventory** (this folder)  
6. ✅ Evaluation & Scoring System → `Documents/dfd-evaluation-scoring/`  
7. → Certification Issuance (next)

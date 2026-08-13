# DFD — Hazard Assessment Profile (Level 0 · 1 · 2)

**Scope:** Sidebar module **Hazard Assessment Profile** (barangay profile, hazards, documents, intelligence).  
**Consumers:** Training Module, Simulation Event Planning, AI Scenario Training, Resource Inventory.

---

## Draw.io files

| Order | File |
|-------|------|
| 1 | `17_DFD_Hazard_Assessment_L0.drawio` |
| 2 | `17_DFD_Hazard_Assessment_L1.drawio` |
| 3 | `17_DFD_Hazard_Assessment_L2.drawio` |

**All-in-one (3 tabs):** `17_DFD_Hazard_Assessment_L0_L1_L2.drawio`

---

## Level 0 — Context

**Process 0:** Hazard Assessment Profile

| External | Flows |
|----------|--------|
| Lead Trainer / Admin | CRUD profile, hazards, documents; view intelligence |
| Training Module | Module matching / recommended communities |
| Simulation Event Planning | Hazard context for exercises |
| AI Scenario Training | AI context / scenario suggestions |
| Resource & Equipment Inventory | Suggested equipment for hazards |

---

## Level 1 — Processes & stores

| Process | Purpose |
|---------|---------|
| **1.0** Manage Barangay Profile | Create/update/delete `BarangayProfile` |
| **2.0** Capture Hazard Records | Sync `BarangayHazard` types/severity |
| **3.0** Manage Supporting Documents | Upload/download/delete `.docx` evidence |
| **4.0** Generate Intelligence Recommendations | Training / scenario / equipment / trainers |
| **5.0** Expose Profile & Analytics | List, API, dashboard summary |

| Store | Contents |
|-------|----------|
| **D1** | Barangay profiles |
| **D2** | Hazard records |
| **D3** | Supporting documents |
| **D4** | Intelligence package (derived) |
| **D5** | Training catalog (read) |

---

## Level 2 — Process 4.0 detail

| Sub-process | App mapping |
|-------------|-------------|
| **4.1** Load Profile & Hazards | Profile + `hazardRecords` |
| **4.2** Match Training Modules | `recommendTrainingModules` |
| **4.3** Suggest Scenarios / Equipment / Trainers | `suggestScenarios` / `suggestEquipment` / `suggestTrainers` |
| **4.4** Build Intelligence Package | `buildIntelligencePackage` |

---

## Captions

- **Figure __.** DFD Level 0 — Hazard Assessment Profile  
- **Figure __.** DFD Level 1 — Hazard Assessment Profile  
- **Figure __.** DFD Level 2 — Generate Intelligence Recommendations (Process 4.0)

---

## Regenerate

```bash
php Documents/dfd-hazard-assessment/generate_hazard_assessment_dfd.php
```

## Module order (internal only)

1. ✅ Training Module  
2. ✅ AI Scenario Training  
3. ✅ Simulation Event Planning  
4. ✅ Participant Registration & Attendance  
5. ✅ Resource & Equipment Inventory  
6. ✅ Evaluation & Scoring System  
7. ✅ Certification Issuance  
8. ✅ **Hazard Assessment Profile** (this folder)  
9. → Users & Roles (optional)

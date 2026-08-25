# DFD — Overall System (Level 0 · Level 1)

**System:** AlertaraQC — Disaster Preparedness Training & Simulation  
**Purpose:** Thesis “big picture” DFD before the per-module L0–L2 packs.

| Level | Shows |
|-------|--------|
| **Level 0** | Whole system as **Process 0** + external entities only |
| **Level 1** | All **8 internal modules** as processes + shared data stores |

Per-module deep dive (L0→L1→L2) stays in the other `dfd-*` folders.

---

## Draw.io files

| File | Content |
|------|---------|
| `18_DFD_Overall_L0.drawio` | Context (whole system) |
| `18_DFD_Overall_L1.drawio` | All internal modules |
| `18_DFD_Overall_L0_L1.drawio` | Combined (2 tabs) |

Also related: `Documents/09_DFD_Level_0_Context.drawio` (earlier L0 draft — this pack is the updated overall).

---

## Level 0 — External entities

| Entity | Role |
|--------|------|
| LGU Admin / Lead Trainer | Full operations |
| Assistant Trainer / Staff | Roster / personnel |
| Evaluator | Attendance + drill scoring |
| Participant | Learn, register, certify |
| Campaign Planning (Group 6) | External campaigns |
| Google Gemini API | Quiz / scenario generation |
| CPSQC Patrol System | Personnel / notify |
| Public Verifier | Certificate QR verify |

---

## Level 1 — Internal modules (processes)

| Process | Module folder |
|---------|---------------|
| **1.0** Training Module | `dfd-training-module/` |
| **2.0** AI Scenario Training | `dfd-ai-scenario/` |
| **3.0** Simulation Event Planning | `dfd-simulation-event/` |
| **4.0** Participant Reg. & Attendance | `dfd-participant-attendance/` |
| **5.0** Resource & Inventory | `dfd-resource-inventory/` |
| **6.0** Evaluation & Scoring | `dfd-evaluation-scoring/` |
| **7.0** Certification Issuance | `dfd-certification/` |
| **8.0** Hazard Assessment | `dfd-hazard-assessment/` |

### Shared stores (overall L1)

| Store | Contents |
|-------|----------|
| D1 | Module catalog & lessons |
| D2 | AI configs & generated banks |
| D3 | Exercise plans & events |
| D4 | Campaign & event registrations |
| D5 | Attendance records |
| D6 | Equipment catalog & assignments |
| D7 | Evaluation results & scores |
| D8 | Certificates & templates |
| D9 | Barangay hazard profiles |
| D10 | Users & roles (auth) |

**Not internal modules:** Campaign Planning (Group 6), CPSQC, Gemini, Public Verifier.

---

## Captions

- **Figure __.** DFD Level 0 — Overall Context (AlertaraQC)  
- **Figure __.** DFD Level 1 — Overall Decomposition (Internal Modules)

---

## Regenerate

```bash
php Documents/dfd-overall/generate_overall_dfd.php
```

## Suggested defense order

1. Overall L0 → Overall L1  
2. Then pick one module and walk L0 → L1 → L2 (e.g. Simulation Event or Training)

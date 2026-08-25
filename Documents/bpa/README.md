# BPA — Overall System (Level 0 · Level 1)

**Process:** Conduct Disaster Preparedness Training & Simulation  
**System:** AlertaraQC (Barangay San Agustin pilot)  
**View:** TO-BE (proposed digital process)

| Level | Shows |
|-------|--------|
| **Level 0** | Whole process as **one box** + stakeholders |
| **Level 1** | Process 0 broken into **8 internal modules** + handoffs |

BPA uses **process boxes and handoffs**. Data stores belong in DFD, not here.

## Draw.io

| File | Content |
|------|---------|
| `19_BPA_L0.drawio` | BPA Level 0 context |
| `19_BPA_L1.drawio` | BPA Level 1 overall decomposition |
| `19_BPA_L0_L1.drawio` | Combined (2 tabs) — open this first |

Open in [diagrams.net](https://app.diagrams.net) → File → Open from → Device.

## Level 1 — Internal modules

| Process | Module |
|---------|--------|
| **1.0** Training Module | Lessons / publish modules |
| **2.0** AI Scenario Training | Quizzes + final AI scenario |
| **3.0** Simulation Event Planning | Campaign → plan → readiness → publish → monitor |
| **4.0** Participant Reg. & Attendance | Register / check-in |
| **5.0** Resource & Inventory | Internal catalog / assign (no Group 3) |
| **6.0** Evaluation & Scoring | Drill scores |
| **7.0** Certification Issuance | Issue / verify certs |
| **8.0** Hazard Assessment | San Agustin hazard profile |

**External (not internal modules):** Campaign Planning (Group 6), CPSQC, Gemini, Public Verifier.  
**Not connected:** Resource Allocation (Group 3).

## Captions

- **Figure __.** BPA Level 0 — Disaster Preparedness Drill and Simulation Conduct (TO-BE) for Barangay San Agustin.
- **Figure __.** BPA Level 1 — Overall Process Decomposition of AlertaraQC (Internal Modules).

## Related

- Narrative + AS-IS vs TO-BE tables: `Documents/07_BPA_Business_Process_Analysis.md`
- BPMN swimlane: `Documents/08_BPMN_TO_BE_Swimlane.drawio`
- Matching data view: `Documents/dfd-overall/` (DFD L0 + L1)

## Regenerate

```bash
php Documents/bpa/generate_bpa_l0.php
```

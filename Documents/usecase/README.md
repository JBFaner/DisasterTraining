# Use Case Diagrams — Overall + Per Module

UML use case pack for **AlertaraQC** (Barangay San Agustin pilot).

**Open first:** `28_UseCase_All.drawio` (9 tabs)

| # | File | Scope |
|---|------|--------|
| 0 | `28_UseCase_Overall.drawio` | Whole system (top use cases) |
| 1 | `29_UseCase_Training_Module.drawio` | Training Module |
| 2 | `30_UseCase_AI_Scenario.drawio` | AI Scenario Training |
| 3 | `31_UseCase_Simulation_Event.drawio` | Simulation Event Planning |
| 4 | `32_UseCase_Participant_Attendance.drawio` | Participant Reg. & Attendance |
| 5 | `33_UseCase_Resource_Inventory.drawio` | Resource & Inventory |
| 6 | `34_UseCase_Evaluation_Scoring.drawio` | Evaluation & Scoring |
| 7 | `35_UseCase_Certification.drawio` | Certification Issuance |
| 8 | `36_UseCase_Hazard_Assessment.drawio` | Hazard Assessment |

Open in [diagrams.net](https://app.diagrams.net) → File → Open from Device → Export PNG.

## Actors

| Actor | Type |
|-------|------|
| LGU Admin / Lead Trainer | Primary |
| Assistant Trainer / Staff | Primary |
| Evaluator | Primary |
| Participant | Primary |
| Campaign Planning (Group 6) | External system |
| Google Gemini API | External system |
| CPSQC Patrol System | External system |
| Public Verifier | External system |

**Not an actor:** Resource Allocation (Group 3) — inventory is internal only.

## Notation

- Stick figure = human actor  
- Purple box = external system  
- Blue oval = use case  
- Solid line = association  
- Dashed `<<include>>` = required sub-behavior (used sparingly)

## Captions

- **Figure __.** Use Case Diagram — Overall AlertaraQC System  
- **Figure __.** Use Case Diagram — Training Module  
- …one caption per module

## Related

- BPMN per module: `Documents/bpmn-modules/`  
- BPA L0/L1: `Documents/bpa/`  
- DFD overall: `Documents/dfd-overall/`

## Regenerate

```bash
php Documents/usecase/generate_usecase.php
```

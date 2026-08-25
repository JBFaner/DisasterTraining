# BPMN Swimlanes — Per Internal Module (TO-BE)

One swimlane BPMN per sidebar module. Same notation as `Documents/08_BPMN_TO_BE_Swimlane.drawio` (vertical lanes, top → bottom).

**Open first:** `20_BPMN_Modules_All.drawio` (8 tabs)

| # | File | Module |
|---|------|--------|
| 1 | `20_BPMN_Training_Module.drawio` | Training Module |
| 2 | `21_BPMN_AI_Scenario.drawio` | AI Scenario Training |
| 3 | `22_BPMN_Simulation_Event.drawio` | Simulation Event Planning |
| 4 | `23_BPMN_Participant_Attendance.drawio` | Participant Reg. & Attendance |
| 5 | `24_BPMN_Resource_Inventory.drawio` | Resource & Inventory (internal only) |
| 6 | `25_BPMN_Evaluation_Scoring.drawio` | Evaluation & Scoring |
| 7 | `26_BPMN_Certification.drawio` | Certification Issuance |
| 8 | `27_BPMN_Hazard_Assessment.drawio` | Hazard Assessment |

Open in [diagrams.net](https://app.diagrams.net) → File → Open from Device → Export PNG for thesis.

## Rules

- Solid arrow = sequence  
- Dashed = optional / message / loop back  
- Orange diamond = gateway  
- **No Resource Allocation (Group 3)** — inventory is internal  
- Group 6 + CPSQC appear only where they belong (Simulation, Attendance)

## Captions

- **Figure __.** BPMN (TO-BE) — Training Module  
- **Figure __.** BPMN (TO-BE) — AI Scenario Training  
- …one caption per module

## Related

- Overall swimlane: `Documents/08_BPMN_TO_BE_Swimlane.drawio`  
- BPA L0 / L1: `Documents/bpa/`  
- Per-module DFD: `Documents/dfd-training-module/` … `dfd-hazard-assessment/`

## Regenerate

```bash
php Documents/bpmn-modules/generate_module_bpmn.php
```

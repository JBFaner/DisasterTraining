# Documents — Capstone Diagram Pack

Folder for **guidelines** (send to groupmates) and **completed drafts** for previously unchecked items.

| File | What it is | Action |
|------|------------|--------|
| `00_Diagram_Guidelines_for_Groupmates.md` | How to draw every required diagram | **Send to group** |
| `00_Diagram_Guidelines_for_Groupmates.docx` | Word copy of guidelines | Send if they prefer Word |
| `01_BPMN_AS_IS_and_TO_BE.md` / `.docx` | BPMN AS-IS + TO-BE (was unchecked) | Paste figures into manuscript |
| `02_Infrastructure_as_Code.md` / `.docx` | IaC (was unchecked) | Paste into manuscript |
| `03_Microservices_Data_Flow_Diagram.md` / `.docx` | Microservices DFD (was unchecked) | Paste into manuscript |
| `04_Microservices_Communication_Pattern.md` / `.docx` | Communication patterns (was unchecked) | Paste into manuscript |
| `05_CI_CD_Pipeline.png` | CI/CD pipeline diagram (image) | Insert as Figure in manuscript |
| `06_Microservices_Diagram.png` / `.md` | Microservices architecture diagram | Insert as Figure + caption paragraph |
| `07_BPA_Business_Process_Analysis.png` / `.md` / `.docx` | Business Process Analysis (AS-IS vs TO-BE) | Insert figure + BPA tables |
| `08_BPMN_TO_BE_Swimlane.drawio` | BPMN swimlane (Draw.io) — open in diagrams.net | Edit / export PNG for manuscript |
| `09_DFD_Level_0_Context.md` / `.drawio` | **DFD Level 0** (whole system) | Insert as Figure + flow table |
| `dfd-level0-modules/` | **DFD Level 0 per module** (8 Draw.io files + combined tabs) | Open in diagrams.net |
| `dfd-training-module/` | **Training Module DFD Level 0 · 1 · 2** (separate Draw.io files) | Open L0 → L1 → L2 in order |

## Already done by team (guidelines only — polish captions)

BPA · ERD · DFD 0/1 · Workflow · Use Case · Sequence · CI/CD · Microservices diagram · Sprint backlogs · Sprint chart

## Backlog sync

Sprint / Product backlog status (Sprint 7 current) lives in:
- `my-app/SPRINT_BOARD.md`
- `my-app/docs/3.4.6_Sprint_Backlog.md`
- `my-app/docs/3.4.1_Product_Backlog_User_Stories.md`

## How to render Mermaid diagrams

1. Open https://mermaid.live  
2. Paste the ` ```mermaid ` block from the `.md` file  
3. Export PNG/SVG → insert into Word as Figure  

## Regenerate Word copies

```bash
cd my-app
php ../Documents/generate_documents_docx.php
```

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
| `bpa/` | **BPA L0 + L1** (overall process + 8 modules) | Open `19_BPA_L0_L1.drawio` first; pairs with DFD overall |
| `bpmn-modules/` | **BPMN swimlane per module** (8 tabs) | Open `20_BPMN_Modules_All.drawio` first |
| `usecase/` | **Use Case overall + per module** (9 tabs) | Open `28_UseCase_All.drawio` first |
| `erd/` | **ERD overall** (entity-relationship diagram) | Open `37_ERD_Overall.drawio` or use `ERD_Overall.png` in thesis |
| `architecture/` | **Layered App Architecture · IaC · Monitoring · API Gateway · Communication Pattern** (Figures 46 + 43–45 + 38) | Open `46_Application_Architecture_Layered.drawio` or `43_45_Thesis_Architecture_All.drawio` |
| `sequence/` | **UML Sequence diagrams** (3 critical scenarios) | Open `39_Sequence_All.drawio` first |
| `network-topology/` | **Network Topology** (star-tree hybrid) | Open `42_Network_Topology.drawio` or `42_Network_Topology.png` |
| `08_BPMN_TO_BE_Swimlane.drawio` | BPMN swimlane (Draw.io) — open in diagrams.net | Edit / export PNG for manuscript |
| `09_DFD_Level_0_Context.md` / `.drawio` | **DFD Level 0** (whole system — earlier draft) | Insert as Figure + flow table |
| `dfd-overall/` | **Overall DFD L0 + L1** (all 8 internal modules) | Open `18_DFD_Overall_L0_L1.drawio` first for defense |
| `dfd-level0-modules/` | **DFD Level 0 per module** (8 Draw.io files + combined tabs) | Open in diagrams.net |
| `dfd-training-module/` … `dfd-hazard-assessment/` | **Per-module DFD L0 · 1 · 2** | Open L0 → L1 → L2 in order |
| `Week4_Risk_Management_Case_Study_ANSWERED.docx` | Week 4 case study **with answers in tables** (same activity + filled Part I–VI) | Open this (landscape) and submit |
| `Week4_Risk_Management_Student_Answers.md` | Same answers in Markdown | Backup / edit |

## Already done by team (guidelines only — polish captions)

BPA · DFD 0/1 · Workflow · Use Case · **Sequence** (`Documents/sequence/`) · CI/CD · Microservices diagram · Sprint backlogs · Sprint chart · **ERD** (`Documents/erd/`, `my-app/docs/ERD_Overall.png`)

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

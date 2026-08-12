# Diagram & Documentation Guidelines (for Groupmates)

**Project:** LGU Disaster Preparedness Training & Simulation Platform  
**Focus barangay:** San Agustin, Novaliches, Quezon City  
**Product flow to protect:** `Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring`

Send this file to anyone assigned to draw diagrams. Follow the **tool**, **must include**, and **caption** rules so all figures look consistent in the manuscript.

---

## Quick assignment board

| Deliverable | Status | Who does what |
|-------------|--------|----------------|
| BPMN (AS-IS & TO-BE) | **Done in Documents/** | Review / paste into manuscript |
| BPA | **Done in Documents/** | Review / paste into manuscript |
| ERD | Done by team ✓ | Polish caption + figure number only |
| DFD Level 0 & 1 | Done by team ✓ | Polish caption + figure number only |
| Workflow Diagram | Done by team ✓ | Polish caption + figure number only |
| Use Case Diagram | Done by team ✓ | Polish caption + figure number only |
| Sequence Diagram | Done by team ✓ | Polish caption + figure number only |
| Infrastructure as Code | **Done in Documents/** | Review / paste into manuscript |
| CI/CD Pipeline | Done by team ✓ | Align labels with Hostinger deploy |
| Data Flow Diagram (Microservices) | **Done in Documents/** | Review / paste into manuscript |
| Communication Pattern (Microservices) | **Done in Documents/** | Review / paste into manuscript |
| Microservices Diagram | Done by team ✓ | Keep service names consistent (see § Naming) |
| Sprints (Backlogs) | Done by team ✓ | Match Sprint Board / backlog docs |
| Sprint Chart | Done by team ✓ | Match Sprint Board / backlog docs |

---

## Shared rules (everyone)

1. **Title every figure** as: `Figure X. <Name> of the Disaster Preparedness Training and Simulation System`
2. **One idea per diagram** — do not mix AS-IS and TO-BE in one canvas.
3. **Use project names**, not e-commerce / generic templates:
   - Actors: Admin, Lead Trainer, Assistant Trainer, Evaluator, Staff, Participant
   - Modules: Training Modules, Campaign Requests, Exercise Plans, Simulation Events, Hazard Assessment, Evaluation, Attendance, Certificates
4. **Export** as PNG or SVG (300 dpi if possible) before inserting into Word.
5. **Keep a source file** (`.drawio`, Lucidchart link, or Mermaid `.md`) in the group drive.
6. **Defense tip:** Be ready to explain *why* each box exists in 1–2 sentences.

### Recommended tools

| Diagram type | Preferred tool |
|--------------|----------------|
| BPMN | Draw.io (BPMN shapes) / Camunda Modeler |
| BPA / Workflow | Draw.io / Lucidchart |
| ERD | Draw.io / dbdiagram.io / MySQL Workbench |
| DFD | Draw.io (Gane–Sarson or Yourdon) |
| UML (Use Case, Sequence) | Draw.io / StarUML / PlantUML |
| Architecture / Microservices | Draw.io / Mermaid |
| CI/CD / IaC | Mermaid / Draw.io |
| Sprint chart | Excel / Jira export / burndown from Sprint Board |

### Naming (use consistently)

| Prefer | Avoid |
|--------|--------|
| Authentication Service | Auth Microservice #3 |
| Simulation Core / Event Lifecycle | Simulation Engine v2 |
| AI Scenario Generator (Gemini) | Chatbot Module |
| Reporting & Evaluation Service | Analytics Thing |
| Campaign Planning (Group 6) | External Site |
| CPSQC Patrol Integration | Patrol API random |

---

## Per-diagram guidelines

### 1. BPMN (AS-IS and TO-BE) — *already drafted*

**Goal:** Show process change from manual LGU drills → digital platform flow.

**Must include**
- Start / End events
- Pools/lanes: LGU Admin/Trainer, Participants, (TO-BE) System / Integrations
- Gateways for decisions (approve/reject campaign, ready/not ready to publish)
- AS-IS: paper attendance, static scenarios, no AI, delayed reports
- TO-BE: Approved Campaign → Exercise Plan → Template → Readiness → Publish → Monitoring

**Caption example:** `Figure __. BPMN Diagram (AS-IS) of Barangay Drill Conduct`  
**Caption example:** `Figure __. BPMN Diagram (TO-BE) of Simulation Event Lifecycle`

See: `Documents/01_BPMN_AS_IS_and_TO_BE.md`

---

### 2. BPA (Business Process Analysis) ✓

**Goal:** Narrative + table of current vs proposed process (pairs with BPMN).

**Must include**
- Process name, owner, trigger, output
- Pain points (AS-IS)
- Improvements (TO-BE)
- KPI / benefit (time, accuracy, audit trail)

**Do not** redraw the BPMN inside BPA — reference the BPMN figures.

---

### 3. ERD ✓

**Goal:** Main entities and relationships of the training platform.

**Must include (minimum)**
- `users`, roles/permissions
- `training_modules`, lessons
- `campaign_requests`
- `simulation_events` / exercise templates
- `barangay_profiles` / hazards / documents
- `participants` / attendance / evaluations / certificates

**Rules**
- Crow’s foot or UML notation — pick one and stick to it
- Show PK/FK; mark 1:N and M:N clearly
- Do not dump every Laravel pivot if it clutters — keep a “core ERD” + optional “detail ERD”

---

### 4. DFD Level 0 & Level 1 ✓

**Level 0 (Context):** One process bubble = whole system; external entities only (Admin, Trainer, Participant, Gemini API, Campaign Planning, CPSQC, etc.).

**Level 1:** Decompose into major processes (Auth, Training, Campaign, Simulation Planning, Monitoring/Eval, Reporting).

**Must include:** data stores (Training DB, Simulation DB, Logs) as open rectangles.

**Avoid:** UI screen wires; that belongs to wireframes, not DFD.

---

### 5. Workflow Diagram ✓

**Goal:** Happy-path operational flow for one main use (recommended: **simulation lifecycle**).

**Must include:** Campaign approved → plan exercise → assign personnel/resources → readiness checklist → publish → live monitoring → evaluation → certificates / AAR.

---

### 6. Use Case Diagram ✔

**Actors:** Admin, Lead Trainer, Assistant Trainer, Evaluator, Staff, Participant (+ optional External Systems as actors).

**Include** top use cases only (8–15 ovals). Example: Manage Users, Manage Training Modules, Submit Campaign Request, Plan Simulation Event, Generate AI Scenario, Take Attendance, Evaluate Participants, Issue Certificate, View Dashboard.

**Association lines** from actor to use case; use `<<include>>` / `<<extend>>` sparingly.

---

### 7. Sequence Diagram ✔

Pick **one critical scenario** per diagram (do not mix).

**Recommended set (1–3 diagrams)**
1. Login / centralized auth
2. AI scenario generation (UI → Laravel → Gemini → DB)
3. Campaign approve → event readiness → publish

**Must show:** lifelines, sync messages, return messages, optional alt/opt fragments for failure.

---

### 8. Infrastructure as Code — *already drafted*

**Goal:** Show how environments are declared/repeated (Docker Compose, env configs, deploy scripts), not hand-clicked servers only.

See: `Documents/02_Infrastructure_as_Code.md`

---

### 9. CI/CD Pipeline ✔

**Must include stages:** Commit → Build (`composer` / `npm`) → Test → Deploy (Hostinger) → Operate.

Align labels with `my-app/docs/CI_CD_PIPELINE.md`. Tools: GitHub, Laravel, Vite, Hostinger SSH/cPanel.

---

### 10. Data Flow Diagram for Microservices — *already drafted*

**Goal:** How data moves **between services** (not classic Level-0 enterprise DFD only).

Show: Client → API Gateway/App → Auth / Training / Simulation / AI / Reporting → DBs / Gemini.

See: `Documents/03_Microservices_Data_Flow_Diagram.md`

---

### 11. Communication Pattern for Microservices — *already drafted*

**Goal:** Sync request/response vs async events; who calls whom.

Patterns to label: **Synchronous REST/HTTP**, **API Gateway routing**, **External webhook/API pull** (Group 6), **Scheduled jobs** if any.

See: `Documents/04_Microservices_Communication_Pattern.md`

---

### 12. Microservices Diagram ✔

Boxes for services + external systems. Keep the same names as § Naming. Show DB per service or shared DB with a note: *“logical services on modular monolith / Laravel modules for capstone deployment.”* (Honest for defense.)

---

### 13. Sprints (Backlogs) ✓

Use existing backlog docs under `my-app/docs/3.4*.md` and `SPRINT_BOARD.md`.

**Table columns:** Sprint # | Backlog Item / User Story | Priority | Status | Owner

---

### 14. Sprint Chart ✓

Burndown or sprint progress chart. X = days in sprint, Y = remaining story points / tasks. Export from board tracking; caption must say which Sprint number.

---

## Defense one-liners (memorize)

| Diagram | One-liner |
|---------|-----------|
| BPMN AS-IS | “Before: manual, static drills with weak documentation.” |
| BPMN TO-BE | “After: digital lifecycle from approved campaign to monitoring.” |
| ERD | “Shows how users, events, participants, and evaluations relate.” |
| DFD | “Shows who exchanges what data with the system.” |
| Sequence | “Shows time-ordered calls for one critical feature.” |
| Microservices | “Logical separation of auth, simulation, AI, reporting.” |
| CI/CD | “Automated path from commit to Hostinger production.” |
| IaC | “Repeatable environment definition via Compose and config-as-code.” |

---

## Submission checklist (before inserting into manuscript)

- [ ] Figure number reserved in Chapter 3 / 4 list of figures  
- [ ] Caption uses project name (not template leftover)  
- [ ] Actor/service names match this guideline  
- [ ] Source file saved in group drive  
- [ ] PNG/SVG exported and readable when printed B&W  
- [ ] Short paragraph under the figure (3–5 sentences) explaining it  

---

## Folder map

```
Documents/
  README.md
  00_Diagram_Guidelines_for_Groupmates.md   ← this file (SEND TO GROUP)
  01_BPMN_AS_IS_and_TO_BE.md (+ .docx)
  02_Infrastructure_as_Code.md (+ .docx)
  03_Microservices_Data_Flow_Diagram.md (+ .docx)
  04_Microservices_Communication_Pattern.md (+ .docx)
```

# Business Process Analysis (BPA)

**Process name:** Barangay / LGU Disaster Preparedness Drill & Simulation Conduct  
**System:** Disaster Preparedness Training & Simulation Platform (AlertaraQC)  
**Pilot community:** Barangay San Agustin, Novaliches, Quezon City  
**Figure image:** `Documents/07_BPA_Business_Process_Analysis.png`  
**Related diagram:** BPMN AS-IS / TO-BE (`Documents/01_BPMN_AS_IS_and_TO_BE.md`)

---

## 1. Process identification

| Item | Detail |
|------|--------|
| **Process owner (AS-IS)** | Barangay / LGU trainer or preparedness officer (manual coordination) |
| **Process owner (TO-BE)** | Lead Trainer / LGU Admin (Full Operations); Evaluator for scoring & attendance |
| **Trigger** | Need to conduct a preparedness drill / simulation for the community |
| **Primary output (AS-IS)** | Completed drill with paper attendance and delayed written notes |
| **Primary output (TO-BE)** | Published, monitored simulation event with digital attendance, evaluation, certificates, and reusable records |
| **Policy anchors** | RA 10121 (PDRRM Act); NDRRMP preparedness pillar; local BDRRM practice |

---

## 2. AS-IS process (current / manual)

### Narrative
Drills are organized with limited system support. Scenarios are often static (paper or slides). Participants are notified through informal channels. Attendance is handwritten. Evaluation notes are delayed and hard to consolidate. There is no formal digital **readiness gate** before the activity, and little linkage from campaign approval to after-action learning.

### Steps
1. Drill requested informally  
2. Trainer prepares static scenario (paper/slides)  
3. Notify participants (chat / bulletin / word-of-mouth)  
4. Wait until drill day (manual reschedule if needed)  
5. Manual attendance sheet  
6. Conduct on-site drill  
7. Handwritten evaluator notes  
8. Delayed Word/Excel summary  
9. Archive on paper / personal drive (limited reuse)

### Pain points
| # | Pain point | Effect |
|---|------------|--------|
| 1 | Static scenarios | Weak adaptive decision-making practice |
| 2 | Informal notifications | Uneven participant reach |
| 3 | Manual attendance | Errors, lost sheets, weak audit |
| 4 | No readiness checklist | Events may proceed under-prepared |
| 5 | Delayed evaluation | Slow feedback; hard to certify readiness |
| 6 | Fragmented partner coordination | Campaign / patrol coordination via chat only |
| 7 | Poor knowledge retention | Difficult to repeat or improve next drill |

---

## 3. TO-BE process (proposed / digital platform)

### Narrative
An approved **campaign** becomes an **exercise plan** (optionally from a **template**), then passes **readiness** (personnel, resources, hazard profile). When ready, the event is **published** and **monitored** (attendance, lifecycle, evaluation). AI-assisted scenarios and partner APIs (Campaign Planning, CPSQC) support repeatable, auditable drills for San Agustin.

### Protected product flow
`Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring`

### Steps
1. Submit Training Campaign Request from Training Module  
2. Campaign Planning (Group 6) approve / reject  
3. Create Exercise Plan (use template or custom)  
4. Complete Readiness checklist  
5. Publish Simulation Event  
6. Monitoring: attendance · lifecycle · evaluation  
7. Issue certificates / after-action reports  
8. Retain digitized records for reuse and defense evidence

### Improvements
| # | Improvement | Benefit |
|---|-------------|---------|
| 1 | Gated digital lifecycle | Incomplete events are not published |
| 2 | Role-aware access | Lead Trainer ops; Assistant personnel; Evaluator eval+attendance |
| 3 | AI scenario generation | Dynamic, reusable scenarios (Gemini) |
| 4 | Digital attendance & scoring | Faster, auditable outcomes |
| 5 | Partner integrations | Campaign approve + optional CPSQC patrol |
| 6 | Hazard profile + Word docs | Grounded San Agustin risk context |
| 7 | Certificates & dashboards | Measurable preparedness evidence |

---

## 4. AS-IS vs TO-BE comparison (BPA core table)

| Dimension | AS-IS | TO-BE |
|-----------|-------|-------|
| Scenario design | Static paper/slides | Manual + AI-generated scenarios |
| Approvals | Informal | Campaign Planning approve/reject |
| Planning | Ad-hoc | Exercise plan + optional template |
| Readiness | Often skipped | Mandatory checklist before publish |
| Attendance | Paper sheet | Digital attendance module |
| Evaluation | Delayed handwritten notes | In-platform scoring & analytics |
| Records | Personal drives / paper | Central DB + supporting documents |
| Partners | Chat/email | API integrations (Group 6, CPSQC) |
| Roles | Unclear / overlapping | Admin · Lead · Assistant · Evaluator · Staff · Participant |
| Reuse | Low | High (templates, history, certificates) |

---

## 5. Stakeholders & RACI (TO-BE)

| Activity | Admin | Lead Trainer | Assistant Trainer | Evaluator | Staff | Participant |
|----------|-------|--------------|-------------------|-----------|-------|-------------|
| Approve system config / users | A/R | C | I | I | I | I |
| Campaign → Exercise Plan | C | A/R | C | I | I | I |
| Personnel / roster support | C | A | R | I | R | I |
| Readiness & publish | C | A/R | I | C | I | I |
| Attendance | I | A | I | R | I | C |
| Evaluation / scoring | C | A | I | R | I | C |
| Take drill / training | I | I | I | I | I | R |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

---

## 6. KPIs / expected benefits

| KPI | AS-IS (baseline) | TO-BE (target) |
|-----|------------------|----------------|
| Time to finalize attendance | Days (manual encode) | Same day (digital) |
| Events published without readiness | Common | Blocked by checklist |
| Traceable evaluation records | Partial / paper | 100% in system for completed events |
| Reusable exercise templates | Rare | Standard path |
| Partner approval visibility | Opaque (chat) | Status in platform |

---

## 7. Gaps closed by the system (summary)

1. **Process control** — readiness and publish gates  
2. **Information quality** — structured attendance, scores, hazard docs  
3. **Coordination** — campaign and patrol integrations  
4. **Accountability** — RBAC + audit-friendly digital trail  
5. **Learning loop** — evaluation → certification → next exercise improvement  

---

## 8. Manuscript caption & paragraph

**Figure __.** Business Process Analysis (AS-IS vs TO-BE) of Disaster Preparedness Drill and Simulation Conduct for Barangay San Agustin.

The Business Process Analysis compares the manual barangay drill process with the proposed digital lifecycle of the training and simulation platform. In the AS-IS state, drills rely on static scenarios, informal notification, paper attendance, and delayed evaluation, which limits auditability and reuse. The TO-BE process introduces a gated flow from approved campaign through exercise planning, optional templates, readiness validation, publishing, and monitoring with digital attendance, evaluation, and certification. These changes support RA 10121 preparedness practice and provide measurable evidence for the San Agustin pilot.

---

## 9. Defense talking points

1. BPA explains **why** the system exists; BPMN shows **how** the flow runs.  
2. Biggest change = **readiness gate** before publish.  
3. Roles prevent “everyone is admin” — Lead vs Assistant vs Evaluator.  
4. San Agustin hazard profile grounds the process in a real LGU community.

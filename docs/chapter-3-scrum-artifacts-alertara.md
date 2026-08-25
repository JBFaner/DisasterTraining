# 3.3 Sprint Cycles

Development work for the **LGU Disaster Preparedness Training & Simulation System (AlertaraQC)** is organized into repeating **two-week** sprint cycles. For this thesis implementation, the operational pilot scope is **Barangay San Agustin**, Quezon City—covering training modules, campaigns, simulation events, evaluation, and certification for that community.

### Table no. 2 — Scrum Board (completed pilot scope)

| To Do | In Progress | Done |
|---|---|---|
| | | Auth + refined RBAC (Lead / Assistant / Evaluator) |
| | | Campaign → Exercise → Readiness → Publish → Monitoring |
| | | CPSQC patrol · Equipment requests |
| | | Evaluation · Certificates (internal) |
| | | Hazard profile + Word supporting docs |
| | | Light/Dark theme · Print helpers · Notifications |
| | | Per-module DFD L0–L2 (8 internal modules) |
| | | Overall DFD L0 + L1 · BPMN/IaC/MS/BPA diagram drafts |
| | | Role access matrix verified on production |
| | | Week 4 IT Auditing risk case study (answered) |

- **Sprint Planning:** The team selects the highest-priority items from the Product Backlog and commits to delivering them within the Sprint.
- **Daily Stand-up:** Short daily sync on progress, blockers, and ownership.
- **Sprint Review:** Demo completed increments to the Product Owner and Barangay San Agustin / LGU stakeholders.
- **Sprint Retrospective:** Reflect on process/tools and agree on improvements for the next sprint.

# 3.4 Scrum Artifacts

## 3.4.1 Product Backlog (User Stories)

*Scope note: User stories below are framed for the **Barangay San Agustin** pilot of AlertaraQC.*

| User Story No. | Features / Task | User Stories | Priority | Status |
|---|---|---|---|---|
| **MODULE 1 — Portal, Auth, Users & Access Control** | | | | |
| F1 | Public Landing Page | As a Barangay San Agustin trainer, I want public landing page so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F2 | Admin OTP Login | As an AlertaraQC administrator, I want admin OTP login so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F3 | Participant Registration | As a CPSQC coordinator, I want participant registration so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F4 | Email Verification | As a Barangay San Agustin preparedness officer, I want email verification so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F5 | Role-Based Sidebar | As a Barangay San Agustin participant, I want role-based sidebar so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F6 | Users CRUD | As a Barangay San Agustin trainer, I want users CRUD so that authorized San Agustin users can access the portal securely. | High | Done |
| F7 | Roles Management | As an AlertaraQC administrator, I want roles management so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F8 | Permissions Matrix | As a CPSQC coordinator, I want permissions matrix so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F9 | Session Idle Timeout | As a Barangay San Agustin preparedness officer, I want session idle timeout so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F10 | Profile Picture Upload | As a Barangay San Agustin participant, I want profile picture upload so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F11 | Audit Log Viewer | As a Barangay San Agustin trainer, I want audit log viewer so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F12 | Backup Trigger | As an AlertaraQC administrator, I want backup trigger so that authorized San Agustin users can access the portal securely. | High | Done |
| F13 | Backup Download | As a CPSQC coordinator, I want backup download so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F14 | Portal Notifications | As a Barangay San Agustin preparedness officer, I want portal notifications so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F15 | Forgot Password Flow | As a Barangay San Agustin participant, I want forgot password flow so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F16 | CSRF Protection | As a Barangay San Agustin trainer, I want CSRF protection so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F17 | Password Hashing | As an AlertaraQC administrator, I want password hashing so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F18 | Barangay Field On Profile | As a CPSQC coordinator, I want barangay field on profile so that authorized San Agustin users can access the portal securely. | High | Done |
| F19 | Participant Status Active/Inactive | As a Barangay San Agustin preparedness officer, I want participant status active/inactive so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F20 | Super Admin Override | As a Barangay San Agustin participant, I want super admin override so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F21 | Login Rate Limiting | As a Barangay San Agustin trainer, I want login rate limiting so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F22 | Remember Device | As an AlertaraQC administrator, I want remember device so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F23 | Logout All Sessions | As a CPSQC coordinator, I want logout all sessions so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F24 | Activity Ping | As a Barangay San Agustin preparedness officer, I want activity ping so that authorized San Agustin users can access the portal securely. | High | Done |
| F25 | Legacy Route Redirects | As a Barangay San Agustin participant, I want legacy route redirects so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F26 | Guest Campaign Landing | As a Barangay San Agustin trainer, I want guest campaign landing so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F27 | Register CTA From Homepage | As an AlertaraQC administrator, I want register CTA from homepage so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F28 | Login Branding | As a CPSQC coordinator, I want login branding so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F29 | Error Flash Messages | As a Barangay San Agustin preparedness officer, I want error flash messages so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F30 | Maintenance Banner | As a Barangay San Agustin participant, I want maintenance banner so that authorized San Agustin users can access the portal securely. | High | Done |
| **MODULE 2 — Training Modules, Lessons & Lesson Quizzes** | | | | |
| F31 | Training Module Create | As a Barangay San Agustin trainer, I want training module create so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F32 | Module Edit | As an AlertaraQC administrator, I want module edit so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F33 | Module Publish | As a CPSQC coordinator, I want module publish so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F34 | Module Archive | As a Barangay San Agustin preparedness officer, I want module archive so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F35 | Module Delete Soft | As a Barangay San Agustin participant, I want module delete soft so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F36 | Lesson Add | As a Barangay San Agustin trainer, I want lesson add so that authorized San Agustin users can access the portal securely. | High | Done |
| F37 | Lesson Edit | As an AlertaraQC administrator, I want lesson edit so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F38 | Lesson Reorder Drag-Drop | As a CPSQC coordinator, I want lesson reorder drag-drop so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F39 | Lesson Delete | As a Barangay San Agustin preparedness officer, I want lesson delete so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F40 | Resource PDF Upload | As a Barangay San Agustin participant, I want resource PDF upload so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |

**Table no. 3 Product Backlog (40 stories — matched classmate reference count)**

## 3.4.2 Product Backlog for EIS Information Security

| EIS No. | EIS User Stories | EIS IS Priority | Revision Priority | Status |
|---|---|---|---|---|
| IS-1 | As a system owner, I want the platform to authenticate all portal routes so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-2 | As a system owner, I want the platform to enforce OTP on admin login so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-3 | As a system owner, I want the platform to require participant email verification so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-4 | As a system owner, I want the platform to apply CSRF tokens so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-5 | As a system owner, I want the platform to enforce RBAC on publish actions so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-6 | As a system owner, I want the platform to enforce RBAC on delete actions so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-7 | As a system owner, I want the platform to idle session logout so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-8 | As a system owner, I want the platform to hash passwords with bcrypt so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-9 | As a system owner, I want the platform to store files on private disk so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-10 | As a system owner, I want the platform to authorize document downloads so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |

**Table no. 4 Product Backlog for EIS Information Security (10 stories)**

## 3.4.3 Product Backlog for EIS Standards

| EIS Standard No. | EIS Standard User Stories | EIS Standard Priority | Revision Priority | Status |
|---|---|---|---|---|
| STD-1 | As a developer, I want a single Laravel modular app entry so that Barangay San Agustin features stay in one maintainable codebase. | 1 | 1 | Done |
| STD-2 | As a developer, I want versioned MySQL migrations so that San Agustin pilot schema changes stay traceable. | 1 | 1 | Done |
| STD-3 | As a developer, I want named routes and policies so that AlertaraQC access rules stay consistent across modules. | 2 | 1 | Done |
| STD-4 | As a developer, I want environment-based config (no secrets in repo) so that San Agustin deployments stay secure. | 1 | 2 | Done |
| STD-5 | As an operator, I want CI checks on push so that broken builds do not reach the San Agustin pilot environment. | 2 | 2 | Done |
| STD-6 | As an operator, I want documented scheduled jobs so that reminders and sync tasks for San Agustin run predictably. | 2 | 2 | Done |

**Table no. 5 Product Backlog for EIS Standards (6 stories)**

### 3.4.3.1 UI/UX (Icons, Color, etc.)
| EIS Standard No. | EIS Standard User Stories | EIS Standard Priority | Revision Priority | Status |
|---|---|---|---|---|
| UI-1 | As an end user, I want consistent emerald primary CTA so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-2 | As an end user, I want Lucide icon navigation so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-3 | As an end user, I want category color gradients so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-4 | As an end user, I want grid/list toggle so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-5 | As an end user, I want confirm dialogs for deletes so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-6 | As an end user, I want lock badges for gated content so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-7 | As an end user, I want AI generation loading banners so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-8 | As an end user, I want print-friendly table styles so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-9 | As an end user, I want responsive 1/2/3 column grids so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-10 | As an end user, I want Getting Started step order so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-11 | As an end user, I want status badge color semantics so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-12 | As an end user, I want empty states with next actions so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |

**Table no. 6 UI/UX (Icons, Color, etc.) (12 stories)**

## 3.4.4 Product Backlog for EIS Integration

| EIS Integration No. | EIS Integration User Stories | EIS Integration Priority | Revision Priority | Status |
|---|---|---|---|---|
| INT-1 | As an integrator, I want Group 6 campaign outbound submit so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-2 | As an integrator, I want Group 6 approve/reject callback so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-3 | As an integrator, I want CPSQC patrol request create so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-4 | As an integrator, I want CPSQC patrol request list so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-5 | As an integrator, I want CPSQC marshal refresh so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-6 | As an integrator, I want CPSQC source_group alignment so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-7 | As an integrator, I want Gemini lesson quiz generation so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-8 | As an integrator, I want Gemini final scenario generation so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |

**Table no. 7 Product Backlog for EIS Integration (8 stories)**

## 3.4.5 Product Backlog for Analytics

### 3.4.5.1 Application System Analytics

|---|---|---|---|---|
| ASA-1 | As an Admin/Trainer, I want analytics for dashboard module counts so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-2 | As an Admin/Trainer, I want analytics for dashboard event counts so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-3 | As an Admin/Trainer, I want analytics for dashboard participant counts so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-4 | As an Admin/Trainer, I want analytics for avg module completion percent so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-5 | As an Admin/Trainer, I want analytics for participants per module so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-6 | As an Admin/Trainer, I want analytics for lesson quiz pass rates so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-7 | As an Admin/Trainer, I want analytics for quiz fail rates by lesson so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-8 | As an Admin/Trainer, I want analytics for final scenario pass rates so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |

**Table no. 8 Application System Analytics (8 stories)**

### 3.4.5.2 EIS Analytics

| EIS Analytics No. | EIS Analytics Stories | EIS Analytics Priority | Revision Priority | Status |
|---|---|---|---|---|
| EA-1 | As a Product Owner, I want to track sprint burndown remaining points so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-2 | As a Product Owner, I want to track sprint velocity stories/points so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-3 | As a Product Owner, I want to track defect count per sprint so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-4 | As a Product Owner, I want to track backlog % done by module so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-5 | As a Product Owner, I want to track demo readiness checklist % so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-6 | As a Product Owner, I want to track integration health score so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |

**Table no. 9 EIS Analytics (6 stories)**

## 3.4.6 Sprint Backlog (User Stories)

| Task No. | User Story No. | User Stories | Tasks | Timeline | Responsible Team Member/s |
|---|---|---|---|---|---|
| **SPRINT 1 — Foundation & Auth** | | | | | |
| S1_1 | IS-1 | Secure portal routes | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | Frontend Dev |
| S1_2 | IS-2 | Admin OTP login | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | Full-stack |
| S1_3 | F3 | Participant registration | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | AI Engineer |
| S1_4 | F5 | Users & Roles | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | DevOps |
| S1_5 | F4 | Role-based sidebar | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | QA |
| **SPRINT 2 — Training Content** | | | | | |
| S2_1 | IS-6 | Session idle timeout | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | PO/SM |
| S2_2 | F10 | Portal notifications | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | UI/UX |
| S2_3 | IS-4 | CSRF on forms | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Backend Dev |
| S2_4 | F11 | Training Module CRUD | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Frontend Dev |
| S2_5 | F12 | Lesson management | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Full-stack |
| **SPRINT 3 — Campaign & Simulation** | | | | | |
| S3_1 | F13 | Lesson resources | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | AI Engineer |
| S3_2 | F18 | Module progress | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | DevOps |
| S3_3 | F19 | Module card stats | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | QA |
| S3_4 | F15 | Lesson Quiz Generator | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | PO/SM |
| S3_5 | F16 | Lesson quiz attempts | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | UI/UX |
| **SPRINT 4 — Eval, Cert, Hazard** | | | | | |
| S4_1 | UI-7 | AI loading UX | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Backend Dev |
| S4_2 | F21 | Submit campaign request | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Frontend Dev |
| S4_3 | F24 | Public campaign register | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Full-stack |
| S4_4 | F23 | Demo Force Approve | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | AI Engineer |
| S4_5 | F26 | Exercise Plan templates | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | DevOps |
| **SPRINT 5 — Polish & Pilot Hardening** | | | | | |
| S5_1 | F27 | AI Generate Plan | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 9-10 | QA |
| S5_2 | F28 | Use Template batches | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 9-10 | PO/SM |
| S5_3 | F29 | Lifecycle readiness | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 9-10 | UI/UX |
| S5_4 | F30 | Participant simulation unlock | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 9-10 | Backend Dev |
| S5_5 | F31 | Final AI Scenario config | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 9-10 | Frontend Dev |
**Table no. 10 Sprint Backlog (25 tasks across 5 sprints — matched classmate reference count)**

### 3.4.6.1 Sprint Burndown Chart

Committed: **25 story points** over **10 working days** (Sprint 3 example).

| Day | Ideal Remaining | Actual Remaining | Notes |
|---|---|---|---|
| 1 | 23 | 23 | Sprint started |
| 2 | 20 | 21 | Auth middleware done |
| 3 | 18 | 17 | On track |
| 4 | 15 | 15 | Campaign register WIP |
| 5 | 13 | 14 | Mid-sprint review |
| 6 | 10 | 10 | Unlock rule clarified with PO |
| 7 | 8 | 8 | Pagination shipped |
| 8 | 5 | 6 | Prod storage permission defect |
| 9 | 3 | 2 | Polish + docs |
| 10 | 0 | 0 | Sprint goal met |

**Figure no. 5 Sprint Burndown Chart**

### 3.4.6.2 Sprint Velocity Chart (Target vs Completed)

| Sprint | Target Points | Completed Points | Notes |
|---|---|---|---|
| Sprint 1 | 5 | 5 | Auth & access foundation delivered |
| Sprint 2 | 5 | 5 | Training module/lesson scope done |
| Sprint 3 | 5 | 5 | Campaign + exercise plan path done |
| Sprint 4 | 5 | 4 | One carry-over on hazard docs polish |
| Sprint 5 | 5 | 5 | Pilot hardening completed |

**Figure no. 6 Sprint Velocity Chart**

### 3.4.6.3 Cumulative Flow Diagram

| Week | To Do | In Progress | Done |
|---|---|---|---|
| Week 1 | 20 | 4 | 1 |
| Week 2 | 15 | 5 | 5 |
| Week 3 | 12 | 5 | 8 |
| Week 4 | 8 | 4 | 13 |
| Week 5 | 5 | 5 | 15 |
| Week 6 | 3 | 3 | 19 |
| Week 7 | 2 | 3 | 20 |
| Week 8 | 1 | 2 | 22 |
| Week 9 | 1 | 1 | 23 |
| Week 10 | 0 | 0 | 25 |

**Figure no. 7 Cumulative Flow Diagram**
## 3.4.7 Increment

| Sprint No. | Increment / Feature Delivered | User Story / Backlog Reference | Definition of Done (DoD) Criteria | Status | Remarks |
|---|---|---|---|---|---|
| Sprint 1 | Portal authentication & RBAC | IS-1, IS-2, F3, F4, F5 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | San Agustin staff and participants can sign in securely |
| Sprint 1 | Session security baseline | IS-4, IS-6, IS-7 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | CSRF, idle timeout, and hashed passwords enforced |
| Sprint 2 | Training Module & Lesson CMS | F11, F12, F13, F18 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Fire/EQ/Flood modules available for San Agustin pilot |
| Sprint 2 | Lesson Quiz AI pipeline | F15, F16, INT-5 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Gemini generate + attempt flow validated |
| Sprint 3 | Campaign registration path | F21, F22, F23, F24, INT-1 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Public register + Demo Force Approve for San Agustin campaigns |
| Sprint 3 | Exercise plans & event batches | F26, F27, F28, F29 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Batch size capped ~20–30 for San Agustin drills |
| Sprint 3 | Participant simulation unlock | F30, IS-10, UI-14 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Module-complete gate + pagination for San Agustin events |
| Sprint 4 | Final Scenario + Eval + Cert | F31, F32, F33, F35, F36 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Quiz-aware unlock; certificates for San Agustin completers |
| Sprint 4 | Hazard docs + dynamic landing | F1, F37, IS-8, IS-11, UI-15 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | San Agustin hazard documents restored; landing shows live modules |
| Sprint 4 | CPSQC patrol integration | INT-3, INT-4, F39 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Patrol request/list/marshals for San Agustin events |
| Sprint 5 | Flood campaign readiness on landing | F1, F24 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Flood module/campaign path covered in San Agustin scope |
| Sprint 5 | Evaluator account for scoring | F33 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Evaluator role available for San Agustin simulation scoring |
| Sprint 5 | Training Modules Print | F20, UI-8 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Print-ready module list for San Agustin reporting |
| Sprint 5 | Mobile UX hardening | UI-9 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Lesson and event flows usable on mobile for San Agustin users |
| Sprint 5 | Group 6 sync retry UX | INT-1, INT-2 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Outbound sync errors surfaced for San Agustin campaigns |
| Sprint 5 | Attendance QR edge cases | F30 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Check-in window and code validation completed |

**Table no. 11 Increment (16 delivered increments — all Done)**

## Appendix — Table sizing guide

| Artifact | Classmate reference count | This document |
|---|---|---|
| Product Backlog | 40 | 40 (all Done) |
| EIS Information Security | 10 | 10 (all Done) |
| EIS Standards | 6 | 6 (all Done) |
| UI/UX Standards | 12 | 12 (all Done) |
| EIS Integration | 8 | 8 (all Done) |
| Application Analytics | 8 | 8 (all Done) |
| EIS Analytics | 6 | 6 (all Done) |
| Sprint Backlog | 25 (5×5) | 25 |
| Burndown / Velocity / CFD | 3 figures | 3 figures |
| Increment | 16 | 16 (all Done) |

*AlertaraQC — Barangay San Agustin pilot / LGU Disaster Preparedness Training & Simulation — counts aligned to classmate CHAPTER 1–5 artifact reference.*

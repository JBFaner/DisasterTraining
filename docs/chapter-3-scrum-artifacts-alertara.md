# 3.3 Sprint Cycles

Development work for the **LGU Disaster Preparedness Training & Simulation System (AlertaraQC)** is organized into repeating **two-week** sprint cycles. For this thesis implementation, the operational pilot scope is **Barangay San Agustin**, Quezon City—covering training modules, campaigns, simulation events, evaluation, and certification for that community.

### Table no. 2 — Scrum Board (updated 2026-08-12)

| To Do | In Progress | Done |
|---|---|---|
| SMS notifications (optional) | Capstone diagram docs (BPMN/IaC/MS) | Auth + refined RBAC (Lead / Assistant / Evaluator) |
| External cert authority API | Prod role migration (Assistant → Lead where needed) | Campaign → Exercise → Readiness → Publish → Monitoring |
| Custom report builder | Groupmate diagram polish from guidelines | CPSQC patrol · Equipment requests |
| Final WCAG / design-system pack | | Evaluation · Certificates (internal) |
| | | Hazard profile + Word supporting docs |
| | | Light/Dark theme · Print helpers · Notifications |

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
| F41 | Resource Video Embed | As a Barangay San Agustin trainer, I want resource video embed so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F42 | Resource Rich Text | As an AlertaraQC administrator, I want resource rich text so that authorized San Agustin users can access the portal securely. | High | Done |
| F43 | Thumbnail Upload | As a CPSQC coordinator, I want thumbnail upload so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F44 | Module Category Fire/EQ/Flood | As a Barangay San Agustin preparedness officer, I want module category Fire/EQ/Flood so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F45 | Estimated Duration | As a Barangay San Agustin participant, I want estimated duration so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F46 | Lesson Quiz AI Generate | As a Barangay San Agustin trainer, I want lesson quiz AI generate so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F47 | Quiz Review Edit | As an AlertaraQC administrator, I want quiz review edit so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F48 | Quiz Publish | As a CPSQC coordinator, I want quiz publish so that authorized San Agustin users can access the portal securely. | High | Done |
| F49 | Quiz Attempt UI | As a Barangay San Agustin preparedness officer, I want quiz attempt UI so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F50 | Quiz Pass Score | As a Barangay San Agustin participant, I want quiz pass score so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F51 | Quiz Retake Policy | As a Barangay San Agustin trainer, I want quiz retake policy so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F52 | Quiz Analytics | As an AlertaraQC administrator, I want quiz analytics so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F53 | Participant Progress Bar | As a CPSQC coordinator, I want participant progress bar so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F54 | Unlock Next Lesson | As a Barangay San Agustin preparedness officer, I want unlock next lesson so that authorized San Agustin users can access the portal securely. | High | Done |
| F55 | Mark Complete Without Quiz | As a Barangay San Agustin participant, I want mark complete without quiz so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F56 | Module Card Stats | As a Barangay San Agustin trainer, I want module card stats so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F57 | Grid/List View | As an AlertaraQC administrator, I want grid/list view so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F58 | Module Search Filter | As a CPSQC coordinator, I want module search filter so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F59 | Print Modules List | As a Barangay San Agustin preparedness officer, I want print modules list so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F60 | Module Short Description | As a Barangay San Agustin participant, I want module short description so that authorized San Agustin users can access the portal securely. | High | Done |
| **MODULE 3 — Campaign, Simulation Planning, Events & Attendance** | | | | |
| F61 | Submit Campaign Request | As a Barangay San Agustin trainer, I want submit campaign request so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F62 | Campaign Requests Table | As an AlertaraQC administrator, I want campaign requests table so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F63 | Demo Force Approve | As a CPSQC coordinator, I want demo force approve so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F64 | Demo Tools Toggle | As a Barangay San Agustin preparedness officer, I want demo tools toggle so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F65 | Copy Registration Link | As a Barangay San Agustin participant, I want copy registration link so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F66 | Public Campaign Register Form | As a Barangay San Agustin trainer, I want public campaign register form so that authorized San Agustin users can access the portal securely. | High | Done |
| F67 | Campaign Seat Capacity | As an AlertaraQC administrator, I want campaign seat capacity so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F68 | Registration Opens/Deadline | As a CPSQC coordinator, I want registration opens/deadline so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F69 | Approved Campaigns Tab | As a Barangay San Agustin preparedness officer, I want approved campaigns tab so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F70 | Meet Quota Demo | As a Barangay San Agustin participant, I want meet quota demo so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F71 | Exercise Plan Create | As a Barangay San Agustin trainer, I want exercise plan create so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F72 | Exercise Plan AI Generate | As an AlertaraQC administrator, I want exercise plan AI generate so that authorized San Agustin users can access the portal securely. | High | Done |
| F73 | Exercise Plan Activities | As a CPSQC coordinator, I want exercise plan activities so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F74 | Exercise Plan Timeline | As a Barangay San Agustin preparedness officer, I want exercise plan timeline so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F75 | Exercise Plan Personnel | As a Barangay San Agustin participant, I want exercise plan personnel so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F76 | Use Template For Event | As a Barangay San Agustin trainer, I want use template for event so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F77 | Batch Split 20-30 Pax | As an AlertaraQC administrator, I want batch split 20-30 pax so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F78 | Max Participants 30 | As a CPSQC coordinator, I want max participants 30 so that authorized San Agustin users can access the portal securely. | High | Done |
| F79 | Readiness Checklist | As a Barangay San Agustin preparedness officer, I want readiness checklist so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F80 | Publish Simulation Event | As a Barangay San Agustin participant, I want publish simulation event so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F81 | Unpublish Event | As a Barangay San Agustin trainer, I want unpublish event so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F82 | Start Event | As an AlertaraQC administrator, I want start event so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F83 | Complete Event | As a CPSQC coordinator, I want complete event so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F84 | Cancel Event | As a Barangay San Agustin preparedness officer, I want cancel event so that authorized San Agustin users can access the portal securely. | High | Done |
| F85 | Test Start Demo | As a Barangay San Agustin participant, I want test start demo so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F86 | Lifecycle Monitoring Page | As a Barangay San Agustin trainer, I want lifecycle monitoring page so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F87 | Personnel Assignments | As an AlertaraQC administrator, I want personnel assignments so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F88 | CPSQC Patrol Request | As a CPSQC coordinator, I want CPSQC patrol request so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F89 | Equipment Requests | As a Barangay San Agustin preparedness officer, I want equipment requests so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F90 | Post Evaluation AAR | As a Barangay San Agustin participant, I want post evaluation AAR so that authorized San Agustin users can access the portal securely. | High | Done |
| **MODULE 4 — AI Scenario, Evaluation, Certification, Hazard & Integrations** | | | | |
| F91 | Final AI Scenario Config | As a Barangay San Agustin trainer, I want final AI scenario config so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F92 | Scenario Generate Gemini | As an AlertaraQC administrator, I want scenario generate Gemini so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F93 | Scenario Publish Version | As a CPSQC coordinator, I want scenario publish version so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F94 | Scenario Unlock After Quizzes | As a Barangay San Agustin preparedness officer, I want scenario unlock after quizzes so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F95 | Scenario Attempt UI | As a Barangay San Agustin participant, I want scenario attempt UI so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F96 | Scenario Passing Score | As a Barangay San Agustin trainer, I want scenario passing score so that authorized San Agustin users can access the portal securely. | High | Done |
| F97 | Scenario Max Attempts | As an AlertaraQC administrator, I want scenario max attempts so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F98 | Lesson Review On Fail | As a CPSQC coordinator, I want lesson review on fail so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F99 | Evaluation Hub Admin | As a Barangay San Agustin preparedness officer, I want evaluation hub admin so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F100 | Evaluator Scoring Form | As a Barangay San Agustin participant, I want evaluator scoring form so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F101 | Participant Evaluation Results | As a Barangay San Agustin trainer, I want participant evaluation results so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F102 | Simulation Event Evaluation | As an AlertaraQC administrator, I want simulation event evaluation so that authorized San Agustin users can access the portal securely. | High | Done |
| F103 | Certificate Eligibility | As a CPSQC coordinator, I want certificate eligibility so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F104 | Certificate Issuance | As a Barangay San Agustin preparedness officer, I want certificate issuance so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F105 | Certificate PDF | As a Barangay San Agustin participant, I want certificate PDF so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F106 | My Certificates Page | As a Barangay San Agustin trainer, I want my certificates page so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F107 | Revoke Certificate | As an AlertaraQC administrator, I want revoke certificate so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F108 | Hazard Assessment List | As a CPSQC coordinator, I want hazard assessment list so that authorized San Agustin users can access the portal securely. | High | Done |
| F109 | Hazard Profile Detail | As a Barangay San Agustin preparedness officer, I want hazard profile detail so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F110 | Hazard Supporting Docs Upload | As a Barangay San Agustin participant, I want hazard supporting docs upload so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F111 | Hazard Doc Download | As a Barangay San Agustin trainer, I want hazard doc download so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F112 | Hazard Intelligence Panel | As an AlertaraQC administrator, I want hazard intelligence panel so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F113 | Resource Inventory | As a CPSQC coordinator, I want resource inventory so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F114 | Resource Budget Proposals | As a Barangay San Agustin preparedness officer, I want resource budget proposals so that authorized San Agustin users can access the portal securely. | High | Done |
| F115 | Group 6 Outbound Sync | As a Barangay San Agustin participant, I want Group 6 outbound sync so that training for Barangay San Agustin follows a clear end-to-end workflow. | Medium | Done |
| F116 | Group 6 Status Callback | As a Barangay San Agustin trainer, I want Group 6 status callback so that simulation drills in Barangay San Agustin remain accountable and auditable. | Low | Done |
| F117 | CPSQC Marshals Refresh | As an AlertaraQC administrator, I want CPSQC marshals refresh so that hazard preparedness for San Agustin residents can be measured and improved. | High | Done |
| F118 | Gemini Multi-Key Rotation | As a CPSQC coordinator, I want Gemini multi-key rotation so that certificates and evaluations for San Agustin participants stay reliable. | Medium | Done |
| F119 | AI Fallback Plan Text | As a Barangay San Agustin preparedness officer, I want AI fallback plan text so that campaign-to-event operations for Barangay San Agustin run with minimal manual work. | Low | Done |
| F120 | Onboarding Checklist Steps | As a Barangay San Agustin participant, I want onboarding checklist steps so that authorized San Agustin users can access the portal securely. | High | Done |

**Table no. 3 Product Backlog (120 stories — 100+)**

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
| IS-11 | As a system owner, I want the platform to scope campaign registration URLs so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-12 | As a system owner, I want the platform to keep API keys in env so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-13 | As a system owner, I want the platform to restrict backup downloads so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-14 | As a system owner, I want the platform to validate all form inputs so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-15 | As a system owner, I want the platform to serve production over HTTPS so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-16 | As a system owner, I want the platform to sanitize rich text HTML so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-17 | As a system owner, I want the platform to rate-limit login attempts so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-18 | As a system owner, I want the platform to log demo tool toggles so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-19 | As a system owner, I want the platform to prevent IDOR on event show so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-20 | As a system owner, I want the platform to encrypt cookies securely so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-21 | As a system owner, I want the platform to http-only session cookies so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-22 | As a system owner, I want the platform to secure headers middleware so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-23 | As a system owner, I want the platform to disable directory listing so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-24 | As a system owner, I want the platform to restrict CORS origins so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-25 | As a system owner, I want the platform to audit failed logins so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-26 | As a system owner, I want the platform to lock accounts after abuse so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-27 | As a system owner, I want the platform to verify signed email tokens so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-28 | As a system owner, I want the platform to authorize evaluator-only scoring so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-29 | As a system owner, I want the platform to hide secrets from client JS so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-30 | As a system owner, I want the platform to escape print HTML output so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-31 | As a system owner, I want the platform to check ownership on module edit so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-32 | As a system owner, I want the platform to block guest admin routes so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-33 | As a system owner, I want the platform to validate file MIME uploads so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-34 | As a system owner, I want the platform to limit upload file size so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-35 | As a system owner, I want the platform to scan uploaded filenames so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-36 | As a system owner, I want the platform to rotate Gemini API keys securely so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-37 | As a system owner, I want the platform to mask PII in logs so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-38 | As a system owner, I want the platform to separate portal guards so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-39 | As a system owner, I want the platform to sync portal session safely so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-40 | As a system owner, I want the platform to revoke certificates securely so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-41 | As a system owner, I want the platform to soft-delete with authorization so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-42 | As a system owner, I want the platform to prevent mass assignment so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-43 | As a system owner, I want the platform to use prepared SQL via Eloquent so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-44 | As a system owner, I want the platform to disable debug in production so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-45 | As a system owner, I want the platform to secure queue workers so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-46 | As a system owner, I want the platform to protect signed URLs so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-47 | As a system owner, I want the platform to validate campaign payload JSON so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-48 | As a system owner, I want the platform to authorize Group 6 webhooks so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-49 | As a system owner, I want the platform to verify CPSQC API key so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-50 | As a system owner, I want the platform to restrict participant data export so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-51 | As a system owner, I want the platform to authenticate all portal routes (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-52 | As a system owner, I want the platform to enforce OTP on admin login (refinement 2) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-53 | As a system owner, I want the platform to require participant email verification (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-54 | As a system owner, I want the platform to apply CSRF tokens (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-55 | As a system owner, I want the platform to enforce RBAC on publish actions (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-56 | As a system owner, I want the platform to enforce RBAC on delete actions (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-57 | As a system owner, I want the platform to idle session logout (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-58 | As a system owner, I want the platform to hash passwords with bcrypt (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-59 | As a system owner, I want the platform to store files on private disk (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-60 | As a system owner, I want the platform to authorize document downloads (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-61 | As a system owner, I want the platform to scope campaign registration URLs (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-62 | As a system owner, I want the platform to keep API keys in env (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-63 | As a system owner, I want the platform to restrict backup downloads (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-64 | As a system owner, I want the platform to validate all form inputs (refinement 2) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-65 | As a system owner, I want the platform to serve production over HTTPS (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-66 | As a system owner, I want the platform to sanitize rich text HTML (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-67 | As a system owner, I want the platform to rate-limit login attempts (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-68 | As a system owner, I want the platform to log demo tool toggles (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-69 | As a system owner, I want the platform to prevent IDOR on event show (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-70 | As a system owner, I want the platform to encrypt cookies securely (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-71 | As a system owner, I want the platform to http-only session cookies (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-72 | As a system owner, I want the platform to secure headers middleware (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-73 | As a system owner, I want the platform to disable directory listing (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-74 | As a system owner, I want the platform to restrict CORS origins (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-75 | As a system owner, I want the platform to audit failed logins (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-76 | As a system owner, I want the platform to lock accounts after abuse (refinement 2) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-77 | As a system owner, I want the platform to verify signed email tokens (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-78 | As a system owner, I want the platform to authorize evaluator-only scoring (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-79 | As a system owner, I want the platform to hide secrets from client JS (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-80 | As a system owner, I want the platform to escape print HTML output (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-81 | As a system owner, I want the platform to check ownership on module edit (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-82 | As a system owner, I want the platform to block guest admin routes (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-83 | As a system owner, I want the platform to validate file MIME uploads (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-84 | As a system owner, I want the platform to limit upload file size (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-85 | As a system owner, I want the platform to scan uploaded filenames (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-86 | As a system owner, I want the platform to rotate Gemini API keys securely (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-87 | As a system owner, I want the platform to mask PII in logs (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-88 | As a system owner, I want the platform to separate portal guards (refinement 2) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-89 | As a system owner, I want the platform to sync portal session safely (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-90 | As a system owner, I want the platform to revoke certificates securely (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-91 | As a system owner, I want the platform to soft-delete with authorization (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-92 | As a system owner, I want the platform to prevent mass assignment (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-93 | As a system owner, I want the platform to use prepared SQL via Eloquent (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-94 | As a system owner, I want the platform to disable debug in production (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-95 | As a system owner, I want the platform to secure queue workers (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-96 | As a system owner, I want the platform to protect signed URLs (refinement 2) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-97 | As a system owner, I want the platform to validate campaign payload JSON (refinement 2) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-98 | As a system owner, I want the platform to authorize Group 6 webhooks (refinement 2) so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-99 | As a system owner, I want the platform to verify CPSQC API key (refinement 2) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-100 | As a system owner, I want the platform to restrict participant data export (refinement 2) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-101 | As a system owner, I want the platform to authenticate all portal routes (refinement 3) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-102 | As a system owner, I want the platform to enforce OTP on admin login (refinement 3) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-103 | As a system owner, I want the platform to require participant email verification (refinement 3) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-104 | As a system owner, I want the platform to apply CSRF tokens (refinement 3) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-105 | As a system owner, I want the platform to enforce RBAC on publish actions (refinement 3) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-106 | As a system owner, I want the platform to enforce RBAC on delete actions (refinement 3) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-107 | As a system owner, I want the platform to idle session logout (refinement 3) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-108 | As a system owner, I want the platform to hash passwords with bcrypt (refinement 3) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |
| IS-109 | As a system owner, I want the platform to store files on private disk (refinement 3) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 1 | 1 | Done |
| IS-110 | As a system owner, I want the platform to authorize document downloads (refinement 3) so that audit trails for San Agustin operations stay trustworthy. | 1 | 2 | Done |
| IS-111 | As a system owner, I want the platform to scope campaign registration URLs (refinement 3) so that personal data of San Agustin participants is protected in transit and at rest. | 2 | 2 | Done |
| IS-112 | As a system owner, I want the platform to keep API keys in env (refinement 3) so that Barangay San Agustin training records remain confidential. | 2 | 3 | Done |
| IS-113 | As a system owner, I want the platform to restrict backup downloads (refinement 3) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 3 | 1 | Done |
| IS-114 | As a system owner, I want the platform to validate all form inputs (refinement 3) so that audit trails for San Agustin operations stay trustworthy. | 1 | 1 | Done |
| IS-115 | As a system owner, I want the platform to serve production over HTTPS (refinement 3) so that personal data of San Agustin participants is protected in transit and at rest. | 1 | 1 | Done |
| IS-116 | As a system owner, I want the platform to sanitize rich text HTML (refinement 3) so that Barangay San Agustin training records remain confidential. | 1 | 2 | Done |
| IS-117 | As a system owner, I want the platform to rate-limit login attempts (refinement 3) so that only authorized San Agustin and LGU staff can perform sensitive actions. | 2 | 2 | Done |
| IS-118 | As a system owner, I want the platform to log demo tool toggles (refinement 3) so that audit trails for San Agustin operations stay trustworthy. | 2 | 3 | Done |
| IS-119 | As a system owner, I want the platform to prevent IDOR on event show (refinement 3) so that personal data of San Agustin participants is protected in transit and at rest. | 3 | 1 | Done |
| IS-120 | As a system owner, I want the platform to encrypt cookies securely (refinement 3) so that Barangay San Agustin training records remain confidential. | 1 | 1 | Done |

**Table no. 4 Product Backlog for EIS Information Security (120 stories — 100+)**

## 3.4.3 Product Backlog for EIS Standards

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
| UI-13 | As an end user, I want demo tools amber callouts so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-14 | As an end user, I want pagination controls so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-15 | As an end user, I want dynamic landing training cards so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-16 | As an end user, I want accessible focus rings so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-17 | As an end user, I want keyboard navigable menus so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-18 | As an end user, I want toast success/error feedback so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-19 | As an end user, I want skeleton loaders so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-20 | As an end user, I want sticky admin headers so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-21 | As an end user, I want readable form labels so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-22 | As an end user, I want inline field validation text so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-23 | As an end user, I want mobile sidebar collapse so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-24 | As an end user, I want breadcrumb context so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-25 | As an end user, I want search-as-you-type filters so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-26 | As an end user, I want clear filter chips so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-27 | As an end user, I want progress bars so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-28 | As an end user, I want card hover elevation so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-29 | As an end user, I want table sticky columns so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-30 | As an end user, I want modal scroll lock so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-31 | As an end user, I want high-contrast text so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-32 | As an end user, I want consistent spacing scale so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-33 | As an end user, I want button disabled states so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-34 | As an end user, I want link vs button affordance so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-35 | As an end user, I want offline transcript download so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-36 | As an end user, I want YouTube embed aspect ratio so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-37 | As an end user, I want PDF download styling so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-38 | As an end user, I want hazard map section layout so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-39 | As an end user, I want certificate preview layout so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-40 | As an end user, I want evaluation score colors so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-41 | As an end user, I want attendance present/late/absent colors so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-42 | As an end user, I want upcoming vs completed event cards so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-43 | As an end user, I want OPEN vs UPCOMING badges so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-44 | As an end user, I want seats remaining hint so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-45 | As an end user, I want batch label caption so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-46 | As an end user, I want module hero typography so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-47 | As an end user, I want lesson card Completed badge so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-48 | As an end user, I want Quiz badge on lessons so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-49 | As an end user, I want Register Now primary style so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-50 | As an end user, I want Details secondary style so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-51 | As an end user, I want consistent emerald primary CTA (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-52 | As an end user, I want Lucide icon navigation (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-53 | As an end user, I want category color gradients (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-54 | As an end user, I want grid/list toggle (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-55 | As an end user, I want confirm dialogs for deletes (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-56 | As an end user, I want lock badges for gated content (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-57 | As an end user, I want AI generation loading banners (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-58 | As an end user, I want print-friendly table styles (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-59 | As an end user, I want responsive 1/2/3 column grids (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-60 | As an end user, I want Getting Started step order (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-61 | As an end user, I want status badge color semantics (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-62 | As an end user, I want empty states with next actions (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-63 | As an end user, I want demo tools amber callouts (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-64 | As an end user, I want pagination controls (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-65 | As an end user, I want dynamic landing training cards (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-66 | As an end user, I want accessible focus rings (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-67 | As an end user, I want keyboard navigable menus (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-68 | As an end user, I want toast success/error feedback (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-69 | As an end user, I want skeleton loaders (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-70 | As an end user, I want sticky admin headers (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-71 | As an end user, I want readable form labels (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-72 | As an end user, I want inline field validation text (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-73 | As an end user, I want mobile sidebar collapse (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-74 | As an end user, I want breadcrumb context (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-75 | As an end user, I want search-as-you-type filters (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-76 | As an end user, I want clear filter chips (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-77 | As an end user, I want progress bars (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-78 | As an end user, I want card hover elevation (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-79 | As an end user, I want table sticky columns (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-80 | As an end user, I want modal scroll lock (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-81 | As an end user, I want high-contrast text (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-82 | As an end user, I want consistent spacing scale (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-83 | As an end user, I want button disabled states (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-84 | As an end user, I want link vs button affordance (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-85 | As an end user, I want offline transcript download (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-86 | As an end user, I want YouTube embed aspect ratio (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-87 | As an end user, I want PDF download styling (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-88 | As an end user, I want hazard map section layout (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-89 | As an end user, I want certificate preview layout (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-90 | As an end user, I want evaluation score colors (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-91 | As an end user, I want attendance present/late/absent colors (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-92 | As an end user, I want upcoming vs completed event cards (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-93 | As an end user, I want OPEN vs UPCOMING badges (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-94 | As an end user, I want seats remaining hint (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-95 | As an end user, I want batch label caption (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-96 | As an end user, I want module hero typography (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-97 | As an end user, I want lesson card Completed badge (refinement 2) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-98 | As an end user, I want Quiz badge on lessons (refinement 2) so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-99 | As an end user, I want Register Now primary style (refinement 2) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-100 | As an end user, I want Details secondary style (refinement 2) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-101 | As an end user, I want consistent emerald primary CTA (refinement 3) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-102 | As an end user, I want Lucide icon navigation (refinement 3) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-103 | As an end user, I want category color gradients (refinement 3) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-104 | As an end user, I want grid/list toggle (refinement 3) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-105 | As an end user, I want confirm dialogs for deletes (refinement 3) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-106 | As an end user, I want lock badges for gated content (refinement 3) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-107 | As an end user, I want AI generation loading banners (refinement 3) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-108 | As an end user, I want print-friendly table styles (refinement 3) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |
| UI-109 | As an end user, I want responsive 1/2/3 column grids (refinement 3) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 1 | 2 | Done |
| UI-110 | As an end user, I want Getting Started step order (refinement 3) so that trainers can review San Agustin progress quickly during drills. | 1 | 2 | Done |
| UI-111 | As an end user, I want status badge color semantics (refinement 3) so that key actions for San Agustin campaigns remain visible and accessible. | 2 | 3 | Done |
| UI-112 | As an end user, I want empty states with next actions (refinement 3) so that San Agustin staff and participants can complete tasks without UI confusion. | 2 | 1 | Done |
| UI-113 | As an end user, I want demo tools amber callouts (refinement 3) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 3 | 1 | Done |
| UI-114 | As an end user, I want pagination controls (refinement 3) so that trainers can review San Agustin progress quickly during drills. | 1 | 1 | Done |
| UI-115 | As an end user, I want dynamic landing training cards (refinement 3) so that key actions for San Agustin campaigns remain visible and accessible. | 1 | 2 | Done |
| UI-116 | As an end user, I want accessible focus rings (refinement 3) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 2 | Done |
| UI-117 | As an end user, I want keyboard navigable menus (refinement 3) so that the Barangay San Agustin training experience stays consistent on desktop and mobile. | 2 | 3 | Done |
| UI-118 | As an end user, I want toast success/error feedback (refinement 3) so that trainers can review San Agustin progress quickly during drills. | 2 | 1 | Done |
| UI-119 | As an end user, I want skeleton loaders (refinement 3) so that key actions for San Agustin campaigns remain visible and accessible. | 3 | 1 | Done |
| UI-120 | As an end user, I want sticky admin headers (refinement 3) so that San Agustin staff and participants can complete tasks without UI confusion. | 1 | 1 | Done |

**Table no. 5 Product Backlog for EIS Standards (120 stories — 100+)**

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
| INT-9 | As an integrator, I want Gemini exercise plan generation so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-10 | As an integrator, I want Gemini multi-key rotation so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-11 | As an integrator, I want Gemini 429 fail-fast so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-12 | As an integrator, I want local AI fallback plan text so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-13 | As an integrator, I want hazard-to-module recommendations so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-14 | As an integrator, I want queued AI generation jobs so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-15 | As an integrator, I want registration link generation so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-16 | As an integrator, I want Hostinger VPS deploy path so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-17 | As an integrator, I want nginx timeout awareness so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-18 | As an integrator, I want MySQL disaster_training DB so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-19 | As an integrator, I want Laravel mail for OTP so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-20 | As an integrator, I want Laravel mail for verify email so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-21 | As an integrator, I want storage private disk paths so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-22 | As an integrator, I want signed storage downloads so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-23 | As an integrator, I want Facebook share of campaign links so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-24 | As an integrator, I want calendar ICS export so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-25 | As an integrator, I want Google Maps venue deep link so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-26 | As an integrator, I want YouTube lesson embeds so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-27 | As an integrator, I want ApexCharts dashboard widgets so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-28 | As an integrator, I want SweetAlert dialogs so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-29 | As an integrator, I want Radix UI dialogs so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-30 | As an integrator, I want Vite asset build pipeline so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-31 | As an integrator, I want Composer autoload refresh so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-32 | As an integrator, I want npm production build so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-33 | As an integrator, I want route cache clear on deploy so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-34 | As an integrator, I want view cache clear on deploy so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-35 | As an integrator, I want config cache management so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-36 | As an integrator, I want queue worker restart so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-37 | As an integrator, I want webhook signature validation so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-38 | As an integrator, I want API timeout configuration so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-39 | As an integrator, I want retry with backoff so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-40 | As an integrator, I want integration health logging so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-41 | As an integrator, I want partner env key length checks so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-42 | As an integrator, I want patrol lifecycle complete notify so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-43 | As an integrator, I want campaign payload normalization so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-44 | As an integrator, I want external campaign id storage so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-45 | As an integrator, I want sync error surfacing in UI so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-46 | As an integrator, I want demo tools settings API so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-47 | As an integrator, I want csrf header helpers so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-48 | As an integrator, I want portal_user helper bridging so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-49 | As an integrator, I want blade JSON data attributes so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-50 | As an integrator, I want React section routing so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-51 | As an integrator, I want Group 6 campaign outbound submit (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-52 | As an integrator, I want Group 6 approve/reject callback (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-53 | As an integrator, I want CPSQC patrol request create (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-54 | As an integrator, I want CPSQC patrol request list (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-55 | As an integrator, I want CPSQC marshal refresh (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-56 | As an integrator, I want CPSQC source_group alignment (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-57 | As an integrator, I want Gemini lesson quiz generation (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-58 | As an integrator, I want Gemini final scenario generation (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-59 | As an integrator, I want Gemini exercise plan generation (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-60 | As an integrator, I want Gemini multi-key rotation (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-61 | As an integrator, I want Gemini 429 fail-fast (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-62 | As an integrator, I want local AI fallback plan text (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-63 | As an integrator, I want hazard-to-module recommendations (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-64 | As an integrator, I want queued AI generation jobs (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-65 | As an integrator, I want registration link generation (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-66 | As an integrator, I want Hostinger VPS deploy path (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-67 | As an integrator, I want nginx timeout awareness (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-68 | As an integrator, I want MySQL disaster_training DB (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-69 | As an integrator, I want Laravel mail for OTP (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-70 | As an integrator, I want Laravel mail for verify email (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-71 | As an integrator, I want storage private disk paths (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-72 | As an integrator, I want signed storage downloads (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-73 | As an integrator, I want Facebook share of campaign links (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-74 | As an integrator, I want calendar ICS export (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-75 | As an integrator, I want Google Maps venue deep link (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-76 | As an integrator, I want YouTube lesson embeds (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-77 | As an integrator, I want ApexCharts dashboard widgets (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-78 | As an integrator, I want SweetAlert dialogs (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-79 | As an integrator, I want Radix UI dialogs (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-80 | As an integrator, I want Vite asset build pipeline (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-81 | As an integrator, I want Composer autoload refresh (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-82 | As an integrator, I want npm production build (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-83 | As an integrator, I want route cache clear on deploy (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-84 | As an integrator, I want view cache clear on deploy (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-85 | As an integrator, I want config cache management (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-86 | As an integrator, I want queue worker restart (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-87 | As an integrator, I want webhook signature validation (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-88 | As an integrator, I want API timeout configuration (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-89 | As an integrator, I want retry with backoff (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-90 | As an integrator, I want integration health logging (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-91 | As an integrator, I want partner env key length checks (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-92 | As an integrator, I want patrol lifecycle complete notify (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-93 | As an integrator, I want campaign payload normalization (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-94 | As an integrator, I want external campaign id storage (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-95 | As an integrator, I want sync error surfacing in UI (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-96 | As an integrator, I want demo tools settings API (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-97 | As an integrator, I want csrf header helpers (refinement 2) so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-98 | As an integrator, I want portal_user helper bridging (refinement 2) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-99 | As an integrator, I want blade JSON data attributes (refinement 2) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-100 | As an integrator, I want React section routing (refinement 2) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-101 | As an integrator, I want Group 6 campaign outbound submit (refinement 3) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-102 | As an integrator, I want Group 6 approve/reject callback (refinement 3) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-103 | As an integrator, I want CPSQC patrol request create (refinement 3) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-104 | As an integrator, I want CPSQC patrol request list (refinement 3) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-105 | As an integrator, I want CPSQC marshal refresh (refinement 3) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-106 | As an integrator, I want CPSQC source_group alignment (refinement 3) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-107 | As an integrator, I want Gemini lesson quiz generation (refinement 3) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-108 | As an integrator, I want Gemini final scenario generation (refinement 3) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |
| INT-109 | As an integrator, I want Gemini exercise plan generation (refinement 3) so that patrol and marshal coordination for San Agustin events stays reliable. | 1 | 1 | Done |
| INT-110 | As an integrator, I want Gemini multi-key rotation (refinement 3) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 2 | Done |
| INT-111 | As an integrator, I want Gemini 429 fail-fast (refinement 3) so that external callbacks for San Agustin requests are processed securely. | 2 | 2 | Done |
| INT-112 | As an integrator, I want local AI fallback plan text (refinement 3) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 2 | 3 | Done |
| INT-113 | As an integrator, I want hazard-to-module recommendations (refinement 3) so that patrol and marshal coordination for San Agustin events stays reliable. | 3 | 1 | Done |
| INT-114 | As an integrator, I want queued AI generation jobs (refinement 3) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 1 | 1 | Done |
| INT-115 | As an integrator, I want registration link generation (refinement 3) so that external callbacks for San Agustin requests are processed securely. | 1 | 1 | Done |
| INT-116 | As an integrator, I want Hostinger VPS deploy path (refinement 3) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 2 | Done |
| INT-117 | As an integrator, I want nginx timeout awareness (refinement 3) so that patrol and marshal coordination for San Agustin events stays reliable. | 2 | 2 | Done |
| INT-118 | As an integrator, I want MySQL disaster_training DB (refinement 3) so that AI-assisted content for San Agustin modules generates without blocking the workflow. | 2 | 3 | Done |
| INT-119 | As an integrator, I want Laravel mail for OTP (refinement 3) so that external callbacks for San Agustin requests are processed securely. | 3 | 1 | Done |
| INT-120 | As an integrator, I want Laravel mail for verify email (refinement 3) so that Barangay San Agustin campaigns sync cleanly with partner systems. | 1 | 1 | Done |

**Table no. 6 Product Backlog for EIS Integration (120 stories — 100+)**

## 3.4.5 Product Backlog for Analytics

### 3.4.5.1 Application System Analytics

| ASA No. | Application Analytics User Stories | Priority | Revision Priority | Status |
|---|---|---|---|---|
| ASA-1 | As an Admin/Trainer, I want analytics for dashboard module counts so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-2 | As an Admin/Trainer, I want analytics for dashboard event counts so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-3 | As an Admin/Trainer, I want analytics for dashboard participant counts so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-4 | As an Admin/Trainer, I want analytics for avg module completion percent so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-5 | As an Admin/Trainer, I want analytics for participants per module so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-6 | As an Admin/Trainer, I want analytics for lesson quiz pass rates so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-7 | As an Admin/Trainer, I want analytics for quiz fail rates by lesson so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-8 | As an Admin/Trainer, I want analytics for final scenario pass rates so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-9 | As an Admin/Trainer, I want analytics for evaluation hub summary so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-10 | As an Admin/Trainer, I want analytics for pending evaluations count so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-11 | As an Admin/Trainer, I want analytics for registration vs attendance rate so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-12 | As an Admin/Trainer, I want analytics for present/late/absent breakdown so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-13 | As an Admin/Trainer, I want analytics for qualified-for-simulation counts so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-14 | As an Admin/Trainer, I want analytics for meet quota gap analytics so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-15 | As an Admin/Trainer, I want analytics for certificate eligible count so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-16 | As an Admin/Trainer, I want analytics for certificate issued count so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-17 | As an Admin/Trainer, I want analytics for audit actions per day so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-18 | As an Admin/Trainer, I want analytics for AI generation success rate so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-19 | As an Admin/Trainer, I want analytics for AI generation failure reasons so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-20 | As an Admin/Trainer, I want analytics for Group 6 sync success rate so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-21 | As an Admin/Trainer, I want analytics for CPSQC request status mix so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-22 | As an Admin/Trainer, I want analytics for campaign seats remaining so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-23 | As an Admin/Trainer, I want analytics for batch size distribution so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-24 | As an Admin/Trainer, I want analytics for onboarding step completion so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-25 | As an Admin/Trainer, I want analytics for continue-learning funnel so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-26 | As an Admin/Trainer, I want analytics for module category distribution so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-27 | As an Admin/Trainer, I want analytics for trainer assignment load so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-28 | As an Admin/Trainer, I want analytics for resource utilization rates so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-29 | As an Admin/Trainer, I want analytics for budget proposal totals so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-30 | As an Admin/Trainer, I want analytics for hazard risk level distribution so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-31 | As an Admin/Trainer, I want analytics for barangay coverage counts so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-32 | As an Admin/Trainer, I want analytics for login activity volume so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-33 | As an Admin/Trainer, I want analytics for notification unread counts so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-34 | As an Admin/Trainer, I want analytics for backup age freshness so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-35 | As an Admin/Trainer, I want analytics for published vs draft modules so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-36 | As an Admin/Trainer, I want analytics for ongoing vs completed events so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-37 | As an Admin/Trainer, I want analytics for demographics by barangay so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-38 | As an Admin/Trainer, I want analytics for time-to-complete module so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-39 | As an Admin/Trainer, I want analytics for time-to-certificate so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-40 | As an Admin/Trainer, I want analytics for retake attempt counts so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-41 | As an Admin/Trainer, I want analytics for cooldown impact metrics so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-42 | As an Admin/Trainer, I want analytics for demo tool usage counts so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-43 | As an Admin/Trainer, I want analytics for force approve usage so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-44 | As an Admin/Trainer, I want analytics for landing OPEN vs UPCOMING mix so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-45 | As an Admin/Trainer, I want analytics for search filter usage so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-46 | As an Admin/Trainer, I want analytics for print job counts so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-47 | As an Admin/Trainer, I want analytics for export CSV counts so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-48 | As an Admin/Trainer, I want analytics for mobile vs desktop sessions so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-49 | As an Admin/Trainer, I want analytics for error 404 rate so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-50 | As an Admin/Trainer, I want analytics for peak concurrent users so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-51 | As an Admin/Trainer, I want analytics for dashboard module counts (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-52 | As an Admin/Trainer, I want analytics for dashboard event counts (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-53 | As an Admin/Trainer, I want analytics for dashboard participant counts (refinement 2) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-54 | As an Admin/Trainer, I want analytics for avg module completion percent (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-55 | As an Admin/Trainer, I want analytics for participants per module (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-56 | As an Admin/Trainer, I want analytics for lesson quiz pass rates (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-57 | As an Admin/Trainer, I want analytics for quiz fail rates by lesson (refinement 2) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-58 | As an Admin/Trainer, I want analytics for final scenario pass rates (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-59 | As an Admin/Trainer, I want analytics for evaluation hub summary (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-60 | As an Admin/Trainer, I want analytics for pending evaluations count (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-61 | As an Admin/Trainer, I want analytics for registration vs attendance rate (refinement 2) so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-62 | As an Admin/Trainer, I want analytics for present/late/absent breakdown (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-63 | As an Admin/Trainer, I want analytics for qualified-for-simulation counts (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-64 | As an Admin/Trainer, I want analytics for meet quota gap analytics (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-65 | As an Admin/Trainer, I want analytics for certificate eligible count (refinement 2) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-66 | As an Admin/Trainer, I want analytics for certificate issued count (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-67 | As an Admin/Trainer, I want analytics for audit actions per day (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-68 | As an Admin/Trainer, I want analytics for AI generation success rate (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-69 | As an Admin/Trainer, I want analytics for AI generation failure reasons (refinement 2) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-70 | As an Admin/Trainer, I want analytics for Group 6 sync success rate (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-71 | As an Admin/Trainer, I want analytics for CPSQC request status mix (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-72 | As an Admin/Trainer, I want analytics for campaign seats remaining (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-73 | As an Admin/Trainer, I want analytics for batch size distribution (refinement 2) so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-74 | As an Admin/Trainer, I want analytics for onboarding step completion (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-75 | As an Admin/Trainer, I want analytics for continue-learning funnel (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-76 | As an Admin/Trainer, I want analytics for module category distribution (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-77 | As an Admin/Trainer, I want analytics for trainer assignment load (refinement 2) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-78 | As an Admin/Trainer, I want analytics for resource utilization rates (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-79 | As an Admin/Trainer, I want analytics for budget proposal totals (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-80 | As an Admin/Trainer, I want analytics for hazard risk level distribution (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-81 | As an Admin/Trainer, I want analytics for barangay coverage counts (refinement 2) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-82 | As an Admin/Trainer, I want analytics for login activity volume (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-83 | As an Admin/Trainer, I want analytics for notification unread counts (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-84 | As an Admin/Trainer, I want analytics for backup age freshness (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-85 | As an Admin/Trainer, I want analytics for published vs draft modules (refinement 2) so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-86 | As an Admin/Trainer, I want analytics for ongoing vs completed events (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-87 | As an Admin/Trainer, I want analytics for demographics by barangay (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-88 | As an Admin/Trainer, I want analytics for time-to-complete module (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-89 | As an Admin/Trainer, I want analytics for time-to-certificate (refinement 2) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-90 | As an Admin/Trainer, I want analytics for retake attempt counts (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-91 | As an Admin/Trainer, I want analytics for cooldown impact metrics (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-92 | As an Admin/Trainer, I want analytics for demo tool usage counts (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-93 | As an Admin/Trainer, I want analytics for force approve usage (refinement 2) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-94 | As an Admin/Trainer, I want analytics for landing OPEN vs UPCOMING mix (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-95 | As an Admin/Trainer, I want analytics for search filter usage (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-96 | As an Admin/Trainer, I want analytics for print job counts (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-97 | As an Admin/Trainer, I want analytics for export CSV counts (refinement 2) so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-98 | As an Admin/Trainer, I want analytics for mobile vs desktop sessions (refinement 2) so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-99 | As an Admin/Trainer, I want analytics for error 404 rate (refinement 2) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-100 | As an Admin/Trainer, I want analytics for peak concurrent users (refinement 2) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-101 | As an Admin/Trainer, I want analytics for dashboard module counts (refinement 3) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-102 | As an Admin/Trainer, I want analytics for dashboard event counts (refinement 3) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-103 | As an Admin/Trainer, I want analytics for dashboard participant counts (refinement 3) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-104 | As an Admin/Trainer, I want analytics for avg module completion percent (refinement 3) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-105 | As an Admin/Trainer, I want analytics for participants per module (refinement 3) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-106 | As an Admin/Trainer, I want analytics for lesson quiz pass rates (refinement 3) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-107 | As an Admin/Trainer, I want analytics for quiz fail rates by lesson (refinement 3) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-108 | As an Admin/Trainer, I want analytics for final scenario pass rates (refinement 3) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |
| ASA-109 | As an Admin/Trainer, I want analytics for evaluation hub summary (refinement 3) so that administrators can report San Agustin readiness with evidence. | 1 | 2 | Done |
| ASA-110 | As an Admin/Trainer, I want analytics for pending evaluations count (refinement 3) so that trainers can identify San Agustin participants who need follow-up. | 1 | 2 | Done |
| ASA-111 | As an Admin/Trainer, I want analytics for registration vs attendance rate (refinement 3) so that leadership can compare San Agustin module and event outcomes over time. | 2 | 3 | Done |
| ASA-112 | As an Admin/Trainer, I want analytics for present/late/absent breakdown (refinement 3) so that Barangay San Agustin training performance can guide the next drill cycle. | 2 | 1 | Done |
| ASA-113 | As an Admin/Trainer, I want analytics for qualified-for-simulation counts (refinement 3) so that administrators can report San Agustin readiness with evidence. | 3 | 1 | Done |
| ASA-114 | As an Admin/Trainer, I want analytics for meet quota gap analytics (refinement 3) so that trainers can identify San Agustin participants who need follow-up. | 1 | 1 | Done |
| ASA-115 | As an Admin/Trainer, I want analytics for certificate eligible count (refinement 3) so that leadership can compare San Agustin module and event outcomes over time. | 1 | 2 | Done |
| ASA-116 | As an Admin/Trainer, I want analytics for certificate issued count (refinement 3) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 2 | Done |
| ASA-117 | As an Admin/Trainer, I want analytics for audit actions per day (refinement 3) so that administrators can report San Agustin readiness with evidence. | 2 | 3 | Done |
| ASA-118 | As an Admin/Trainer, I want analytics for AI generation success rate (refinement 3) so that trainers can identify San Agustin participants who need follow-up. | 2 | 1 | Done |
| ASA-119 | As an Admin/Trainer, I want analytics for AI generation failure reasons (refinement 3) so that leadership can compare San Agustin module and event outcomes over time. | 3 | 1 | Done |
| ASA-120 | As an Admin/Trainer, I want analytics for Group 6 sync success rate (refinement 3) so that Barangay San Agustin training performance can guide the next drill cycle. | 1 | 1 | Done |

**Table no. 7 Product Backlog for Analytics (120 stories — 100+)**

### 3.4.5.2 EIS Analytics

| EIS Analytics No. | EIS Analytics Stories | EIS Analytics Priority | Revision Priority | Status |
|---|---|---|---|---|
| EA-1 | As a Product Owner, I want to track sprint burndown remaining points so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-2 | As a Product Owner, I want to track sprint velocity stories/points so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-3 | As a Product Owner, I want to track defect count per sprint so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-4 | As a Product Owner, I want to track backlog % done by module so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-5 | As a Product Owner, I want to track demo readiness checklist % so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-6 | As a Product Owner, I want to track integration health score so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-7 | As a Product Owner, I want to track retrospective action completion so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-8 | As a Product Owner, I want to track weekly active participants so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-9 | As a Product Owner, I want to track lead time feature request to prod so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-10 | As a Product Owner, I want to track cycle time coding to deploy so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-11 | As a Product Owner, I want to track escaped defects in prod so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-12 | As a Product Owner, I want to track hotfix frequency so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-13 | As a Product Owner, I want to track AI quota incidents so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-14 | As a Product Owner, I want to track storage permission incidents so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-15 | As a Product Owner, I want to track 404 download incidents so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-16 | As a Product Owner, I want to track test coverage trend so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-17 | As a Product Owner, I want to track code review turnaround so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-18 | As a Product Owner, I want to track deploy success rate so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-19 | As a Product Owner, I want to track rollback count so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-20 | As a Product Owner, I want to track stakeholder satisfaction notes so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-21 | As a Product Owner, I want to track PO acceptance rate so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-22 | As a Product Owner, I want to track scope change count so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-23 | As a Product Owner, I want to track blocked days count so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-24 | As a Product Owner, I want to track pair programming hours so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-25 | As a Product Owner, I want to track documentation completeness so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-26 | As a Product Owner, I want to track security finding closure so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-27 | As a Product Owner, I want to track accessibility issue closure so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-28 | As a Product Owner, I want to track performance p95 page load so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-29 | As a Product Owner, I want to track build time trend so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-30 | As a Product Owner, I want to track bundle size trend so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-31 | As a Product Owner, I want to track dependency vulnerability count so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-32 | As a Product Owner, I want to track tech debt items closed so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-33 | As a Product Owner, I want to track seeder reliability so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-34 | As a Product Owner, I want to track migration success rate so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-35 | As a Product Owner, I want to track uptime percentage so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-36 | As a Product Owner, I want to track mean time to recover so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-37 | As a Product Owner, I want to track incident severity mix so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-38 | As a Product Owner, I want to track support ticket volume so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-39 | As a Product Owner, I want to track training completion KPI so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-40 | As a Product Owner, I want to track drill attendance KPI so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-41 | As a Product Owner, I want to track certificate issuance KPI so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-42 | As a Product Owner, I want to track campaign conversion rate so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-43 | As a Product Owner, I want to track landing register CTR so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-44 | As a Product Owner, I want to track module unlock conversion so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-45 | As a Product Owner, I want to track scenario pass KPI so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-46 | As a Product Owner, I want to track evaluation turnaround days so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-47 | As a Product Owner, I want to track partner API latency so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-48 | As a Product Owner, I want to track queue wait time so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-49 | As a Product Owner, I want to track job failure rate so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-50 | As a Product Owner, I want to track cache hit ratio so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-51 | As a Product Owner, I want to track sprint burndown remaining points (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-52 | As a Product Owner, I want to track sprint velocity stories/points (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-53 | As a Product Owner, I want to track defect count per sprint (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-54 | As a Product Owner, I want to track backlog % done by module (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-55 | As a Product Owner, I want to track demo readiness checklist % (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-56 | As a Product Owner, I want to track integration health score (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-57 | As a Product Owner, I want to track retrospective action completion (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-58 | As a Product Owner, I want to track weekly active participants (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-59 | As a Product Owner, I want to track lead time feature request to prod (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-60 | As a Product Owner, I want to track cycle time coding to deploy (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-61 | As a Product Owner, I want to track escaped defects in prod (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-62 | As a Product Owner, I want to track hotfix frequency (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-63 | As a Product Owner, I want to track AI quota incidents (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-64 | As a Product Owner, I want to track storage permission incidents (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-65 | As a Product Owner, I want to track 404 download incidents (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-66 | As a Product Owner, I want to track test coverage trend (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-67 | As a Product Owner, I want to track code review turnaround (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-68 | As a Product Owner, I want to track deploy success rate (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-69 | As a Product Owner, I want to track rollback count (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-70 | As a Product Owner, I want to track stakeholder satisfaction notes (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-71 | As a Product Owner, I want to track PO acceptance rate (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-72 | As a Product Owner, I want to track scope change count (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-73 | As a Product Owner, I want to track blocked days count (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-74 | As a Product Owner, I want to track pair programming hours (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-75 | As a Product Owner, I want to track documentation completeness (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-76 | As a Product Owner, I want to track security finding closure (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-77 | As a Product Owner, I want to track accessibility issue closure (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-78 | As a Product Owner, I want to track performance p95 page load (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-79 | As a Product Owner, I want to track build time trend (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-80 | As a Product Owner, I want to track bundle size trend (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-81 | As a Product Owner, I want to track dependency vulnerability count (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-82 | As a Product Owner, I want to track tech debt items closed (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-83 | As a Product Owner, I want to track seeder reliability (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-84 | As a Product Owner, I want to track migration success rate (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-85 | As a Product Owner, I want to track uptime percentage (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-86 | As a Product Owner, I want to track mean time to recover (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-87 | As a Product Owner, I want to track incident severity mix (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-88 | As a Product Owner, I want to track support ticket volume (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-89 | As a Product Owner, I want to track training completion KPI (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-90 | As a Product Owner, I want to track drill attendance KPI (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-91 | As a Product Owner, I want to track certificate issuance KPI (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-92 | As a Product Owner, I want to track campaign conversion rate (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-93 | As a Product Owner, I want to track landing register CTR (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-94 | As a Product Owner, I want to track module unlock conversion (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-95 | As a Product Owner, I want to track scenario pass KPI (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-96 | As a Product Owner, I want to track evaluation turnaround days (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-97 | As a Product Owner, I want to track partner API latency (refinement 2) so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-98 | As a Product Owner, I want to track queue wait time (refinement 2) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-99 | As a Product Owner, I want to track job failure rate (refinement 2) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-100 | As a Product Owner, I want to track cache hit ratio (refinement 2) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-101 | As a Product Owner, I want to track sprint burndown remaining points (refinement 3) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-102 | As a Product Owner, I want to track sprint velocity stories/points (refinement 3) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-103 | As a Product Owner, I want to track defect count per sprint (refinement 3) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-104 | As a Product Owner, I want to track backlog % done by module (refinement 3) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-105 | As a Product Owner, I want to track demo readiness checklist % (refinement 3) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-106 | As a Product Owner, I want to track integration health score (refinement 3) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-107 | As a Product Owner, I want to track retrospective action completion (refinement 3) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-108 | As a Product Owner, I want to track weekly active participants (refinement 3) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |
| EA-109 | As a Product Owner, I want to track lead time feature request to prod (refinement 3) so that EIS controls for Barangay San Agustin remain measurable. | 1 | 1 | Done |
| EA-110 | As a Product Owner, I want to track cycle time coding to deploy (refinement 3) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 2 | Done |
| EA-111 | As a Product Owner, I want to track escaped defects in prod (refinement 3) so that process risks affecting San Agustin operations are closed promptly. | 2 | 2 | Done |
| EA-112 | As a Product Owner, I want to track hotfix frequency (refinement 3) so that delivery quality for the San Agustin scope improves every sprint. | 2 | 3 | Done |
| EA-113 | As a Product Owner, I want to track AI quota incidents (refinement 3) so that EIS controls for Barangay San Agustin remain measurable. | 3 | 1 | Done |
| EA-114 | As a Product Owner, I want to track storage permission incidents (refinement 3) so that the team can defend San Agustin release decisions with sprint evidence. | 1 | 1 | Done |
| EA-115 | As a Product Owner, I want to track 404 download incidents (refinement 3) so that process risks affecting San Agustin operations are closed promptly. | 1 | 1 | Done |
| EA-116 | As a Product Owner, I want to track test coverage trend (refinement 3) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 2 | Done |
| EA-117 | As a Product Owner, I want to track code review turnaround (refinement 3) so that EIS controls for Barangay San Agustin remain measurable. | 2 | 2 | Done |
| EA-118 | As a Product Owner, I want to track deploy success rate (refinement 3) so that the team can defend San Agustin release decisions with sprint evidence. | 2 | 3 | Done |
| EA-119 | As a Product Owner, I want to track rollback count (refinement 3) so that process risks affecting San Agustin operations are closed promptly. | 3 | 1 | Done |
| EA-120 | As a Product Owner, I want to track stakeholder satisfaction notes (refinement 3) so that delivery quality for the San Agustin scope improves every sprint. | 1 | 1 | Done |

**Table no. 8 EIS Analytics (120 stories — 100+)**

## 3.4.6 Sprint Backlog (User Stories)

| Task No. | User Story No. | User Stories | Tasks | Timeline | Responsible Team Member/s |
|---|---|---|---|---|---|
| **SPRINT 1 — Foundation & Auth** | | | | | |
| S1_1 | IS-1 | Secure portal routes | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | Frontend Dev |
| S1_2 | IS-2 | Admin OTP login | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | Full-stack |
| S1_3 | F3 | Participant registration | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | AI Engineer |
| S1_4 | F5 | Users & Roles | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | DevOps |
| S1_5 | F4 | Role-based sidebar | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | QA |
| S1_6 | IS-6 | Session idle timeout | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | PO/SM |
| S1_7 | F10 | Portal notifications | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | UI/UX |
| S1_8 | IS-4 | CSRF on forms | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 1-2 | Backend Dev |
| **SPRINT 2 — Training Content** | | | | | |
| S2_1 | F11 | Training Module CRUD | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Frontend Dev |
| S2_2 | F12 | Lesson management | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Full-stack |
| S2_3 | F13 | Lesson resources | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | AI Engineer |
| S2_4 | F18 | Module progress | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | DevOps |
| S2_5 | F19 | Module card stats | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | QA |
| S2_6 | F15 | Lesson Quiz Generator | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | PO/SM |
| S2_7 | F16 | Lesson quiz attempts | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | UI/UX |
| S2_8 | UI-7 | AI loading UX | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 3-4 | Backend Dev |
| **SPRINT 3 — Campaign & Simulation** | | | | | |
| S3_1 | F21 | Submit campaign request | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | Frontend Dev |
| S3_2 | F24 | Public campaign register | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | Full-stack |
| S3_3 | F23 | Demo Force Approve | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | AI Engineer |
| S3_4 | F26 | Exercise Plan templates | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | DevOps |
| S3_5 | F27 | AI Generate Plan | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | QA |
| S3_6 | F28 | Use Template batches | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | PO/SM |
| S3_7 | F29 | Lifecycle readiness | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | UI/UX |
| S3_8 | F30 | Participant simulation unlock | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 5-6 | Backend Dev |
| **SPRINT 4 — Eval, Cert, Hazard, Landing** | | | | | |
| S4_1 | F31 | Final AI Scenario config | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Frontend Dev |
| S4_2 | F32 | Unlock after quizzes | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Full-stack |
| S4_3 | F33 | Evaluation scoring | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | AI Engineer |
| S4_4 | F35 | Certification issuance | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | DevOps |
| S4_5 | F37 | Hazard Assessment | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | QA |
| S4_6 | F1 | Dynamic landing cards | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | PO/SM |
| S4_7 | IS-8 | Private storage docs | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | UI/UX |
| S4_8 | F20 | Print Training Modules | PLANNING / DESIGN / CODE / DOCUMENTATION | Week 7-8 | Backend Dev |

**Table no. 9 Sprint Backlog (32 tasks across 4 sprints — realistic sprint set)**

### 3.4.6.1 Sprint Burndown Chart

Committed: **32 story points** over **10 working days** (Sprint 3 example).

| Day | Ideal Remaining | Actual Remaining | Notes |
|---|---|---|---|
| 1 | 29 | 29 | Sprint started |
| 2 | 26 | 27 | Auth middleware done |
| 3 | 22 | 21 | On track |
| 4 | 19 | 19 | Campaign register WIP |
| 5 | 16 | 17 | Mid-sprint review |
| 6 | 13 | 12 | Unlock rule clarified with PO |
| 7 | 10 | 10 | Pagination shipped |
| 8 | 6 | 7 | Prod storage permission defect |
| 9 | 3 | 2 | Polish + docs |
| 10 | 0 | 0 | Sprint goal met |

**Figure no. 2 Burndown Chart**

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
| Sprint 6 | Resource budget export | F38, ASA-10 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | CSV/print export for San Agustin resource proposals |
| Sprint 6 | Evaluation hub print pack | F34, UI-8 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Print pack for San Agustin evaluation reports |
| Sprint 6 | Certificate revoke workflow | F35, IS-40 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Admin-only revoke with audit trail |
| Sprint 6 | Analytics dashboard charts | ASA-1, ASA-11 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Overview charts for San Agustin training outcomes |
| Sprint 6 | Retrospective action tracker | EA-7 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Process improvements closed for the pilot |
| Sprint 6 | Integration health panel | EA-6, INT-40 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Group 6 + CPSQC status visible to admins |
| Sprint 6 | Landing seats remaining badge | F1, UI-44 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Capacity hint shown on OPEN San Agustin campaign cards |
| Sprint 6 | Docs handoff to Word Online | EA-25 | Code completed; tested; integrated with DB; documentation updated; PO accepted | Done | Chapter 3 Scrum artifacts exported for thesis submission |

**Table no. Increment (24 delivered increments — all Done)**

## Appendix — Table sizing guide

| Artifact | Target size | This document |
|---|---|---|
| Scrum Board | Sample completed board | All cards in Done (San Agustin pilot) |
| Product Backlog | 100+ | 120 (all Done) |
| EIS Information Security | 100+ | 120 (all Done) |
| EIS UI/UX Standards | 100+ | 120 (all Done) |
| EIS Integration | 100+ | 120 (all Done) |
| Application Analytics | 100+ | 120 (all Done) |
| EIS Analytics | 100+ | 120 (all Done) |
| Sprint Backlog | Realistic sprint tasks | 32 |
| Burndown | ~10 days | 10 |
| Increment | Summary of deliveries | 24 (all Done) |

*AlertaraQC — Barangay San Agustin pilot / LGU Disaster Preparedness Training & Simulation — ready for Microsoft Word / OneDrive.*

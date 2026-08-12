# Sprint Board (Kanban)

**Project:** Disaster Preparedness Training & Simulation Platform  
**Pilot:** Barangay San Agustin, Quezon City  
**Product flow:** Approved Campaign → Exercise Plan → Use Template → Readiness → Publish → Monitoring  
**Last updated:** 2026-08-12

---

## TO DO
- External certification authority API (INT-2) — optional / future
- SMS notification integration (INT-5)
- Custom report builder (ASA-9)
- SSO exploration beyond centralized login (INT-10)
- Full WCAG accessibility pass (UI-14 polish)
- Design system documentation package (UI-15)
- Message-broker / async notifications (future scale)
- Thesis diagram polish by groupmates (BPA, ERD, DFD, Use Case, Sequence, Sprint chart captions)

## IN PROGRESS
- Capstone documentation pack (BPMN, IaC, microservices DFD/comms guidelines)
- Defense prep: backlog/increment alignment with production demo
- Role migration on prod: promote ops users from Assistant (`LGU_TRAINER`) → Lead Trainer where needed

## DONE
- Secure auth (participant + admin OTP / centralized login)
- Multi-role RBAC baseline + refined role model (Admin, Lead Trainer, Assistant Trainer, Evaluator, Staff, Participant; Viewer retired from UI)
- Lead Trainer = Full Operations; Assistant Trainer = personnel/roster only; Evaluator = evaluation + attendance
- User profile management (incl. picture, barangay fields)
- Training module / lesson CRUD + print list helpers
- AI scenario generation (Gemini)
- Campaign request → Group 6 approve/reject integration
- Exercise plan / templates → readiness → publish → monitoring lifecycle
- CPSQC patrol marshal request flow
- Event equipment request panel (ops)
- Participant registration & attendance
- Evaluation & scoring (lesson quiz + final scenario)
- Certification issuance / eligibility tracking (internal)
- Hazard Assessment profile (San Agustin) + Word supporting documents
- Appearance / light–dark theme (Settings)
- Portal notifications + session idle warning
- Backup / recovery admin tools
- CI/CD & Hostinger production deploy path
- Docker Compose local stack (MySQL, Adminer, Mailpit)

---

### Notes
- Move items between columns as work progresses.
- Keep role labels consistent with `PortalAuth` and Sidebar (Lead vs Assistant).
- Do not revive deprecated Edit Simulation Event form for template-based events.
